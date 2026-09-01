import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { issue } from "#/db/schema";
import { updateIssueSchema } from "#/features/issues/schema";
import { fetchIssue } from "#/lib/data/fetch-issue";
import { fetchIssues } from "#/lib/data/fetch-issues";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { mapActionError } from "#/lib/map-action-error";
import { authMiddleware } from "#/middlewares/auth-middleware";
import { AppError, isUniqueConstraintError } from "#/types/result";

export const listIssuesFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ code: z.string() }))
	.handler(async ({ data, context }) => fetchIssues(context.user, data.code));

export const getIssueFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			code: z.string(),
			issueNumber: z.number().int().positive(),
		}),
	)
	.handler(async ({ data, context }) =>
		fetchIssue(context.user, data.code, data.issueNumber),
	);

export const createIssueFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(z.object({ workspaceCode: z.string() }))
	.handler(async ({ data, context }) => {
		try {
			const { user, workspace } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
			);

			let created: { number: number } | undefined;

			for (let attempt = 0; attempt < 3; attempt += 1) {
				try {
					const [latest] = await db
						.select({ number: issue.number })
						.from(issue)
						.where(eq(issue.workspaceId, workspace.id))
						.orderBy(desc(issue.number))
						.limit(1);

					const number = (latest?.number ?? 0) + 1;

					const [row] = await db
						.insert(issue)
						.values({
							workspaceId: workspace.id,
							reporterId: user.id,
							number,
							title: `New Issue #${number}`,
							status: "TODO",
							priority: null,
						})
						.returning({ number: issue.number });

					created = row;
					break;
				} catch (error) {
					if (!isUniqueConstraintError(error) || attempt === 2) {
						throw error;
					}
				}
			}

			if (!created) {
				throw new AppError("UNKNOWN", "Failed to create issue");
			}

			return { success: true as const, data: created };
		} catch (error) {
			return mapActionError(error, "Failed to create issue");
		}
	});

export const updateIssueFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			issueNumber: z.number().int().positive(),
			input: updateIssueSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const { workspace } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
			);

			const [existing] = await db
				.select({ id: issue.id, number: issue.number })
				.from(issue)
				.where(
					and(
						eq(issue.workspaceId, workspace.id),
						eq(issue.number, data.issueNumber),
					),
				)
				.limit(1);

			if (!existing) {
				throw new AppError("NOT_FOUND", "Issue not found");
			}

			const patch: {
				title?: string;
				status?: typeof data.input.status;
				priority?: typeof data.input.priority;
				startDate?: string | null;
				endDate?: string | null;
				description?: unknown;
			} = {};

			if (data.input.title !== undefined) {
				patch.title = data.input.title.trim();
			}
			if (data.input.status !== undefined) {
				patch.status = data.input.status;
			}
			if (data.input.priority !== undefined) {
				patch.priority = data.input.priority;
			}
			if (data.input.startDate !== undefined) {
				patch.startDate = data.input.startDate;
			}
			if (data.input.endDate !== undefined) {
				patch.endDate = data.input.endDate;
			}
			if (data.input.description !== undefined) {
				patch.description = JSON.parse(JSON.stringify(data.input.description));
			}

			await db.update(issue).set(patch).where(eq(issue.id, existing.id));

			return { success: true as const, data: { number: existing.number } };
		} catch (error) {
			return mapActionError(error, "Failed to update issue");
		}
	});

export const deleteIssueFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			issueNumber: z.number().int().positive(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const { workspace } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
				"ADMIN",
			);

			const [existing] = await db
				.select({ id: issue.id, number: issue.number })
				.from(issue)
				.where(
					and(
						eq(issue.workspaceId, workspace.id),
						eq(issue.number, data.issueNumber),
					),
				)
				.limit(1);

			if (!existing) {
				throw new AppError("NOT_FOUND", "Issue not found");
			}

			await db.delete(issue).where(eq(issue.id, existing.id));

			return { success: true as const, data: { number: existing.number } };
		} catch (error) {
			return mapActionError(error, "Failed to delete issue");
		}
	});
