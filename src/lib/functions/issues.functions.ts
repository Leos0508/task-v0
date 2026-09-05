import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { issue } from "#/db/schema";
import {
	reorderIssueSchema,
	updateIssueSchema,
} from "#/features/issues/schema";
import { createIssue } from "#/lib/data/create-issue";
import { fetchIssue } from "#/lib/data/fetch-issue";
import { fetchIssues } from "#/lib/data/fetch-issues";
import { reorderIssue } from "#/lib/data/reorder-issue";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { updateIssue } from "#/lib/data/update-issue";
import { mapActionError } from "#/lib/map-action-error";
import { authMiddleware } from "#/middlewares/auth-middleware";
import { AppError } from "#/types/result";

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
			const created = await createIssue(context.user, data.workspaceCode);
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
			const updated = await updateIssue(
				context.user,
				data.workspaceCode,
				data.issueNumber,
				data.input,
			);
			return { success: true as const, data: updated };
		} catch (error) {
			return mapActionError(error, "Failed to update issue");
		}
	});

export const reorderIssueFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			issueNumber: z.number().int().positive(),
			input: reorderIssueSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const updated = await reorderIssue(
				context.user,
				data.workspaceCode,
				data.issueNumber,
				data.input,
			);
			return { success: true as const, data: updated };
		} catch (error) {
			return mapActionError(error, "Failed to reorder issue");
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
