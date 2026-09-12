import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { workspace, workspaceUser } from "#/db/schema";
import {
	createWorkspaceSchema,
	updateWorkspaceSchema,
} from "#/features/workspaces/schema";
import { bootstrapUser } from "#/lib/data/bootstrap-user";
import { fetchWorkspaces } from "#/lib/data/fetch-workspaces";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { assertCanJoinWorkspace } from "#/lib/limits";
import { mapActionError } from "#/lib/map-action-error";
import { normalizeWorkspaceCode } from "#/lib/workspace-code";
import { isWorkspaceCodeAvailable } from "#/lib/workspace-code.server";
import { authMiddleware } from "#/middlewares/auth-middleware";

export const listWorkspacesFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		await bootstrapUser(context.user.id);
		return fetchWorkspaces(context.user);
	});

export const isWorkspaceCodeAvailableFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ code: z.string() }))
	.handler(async ({ data }) => ({
		available: await isWorkspaceCodeAvailable(data.code),
	}));

export const getWorkspaceAccessFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			code: z.string(),
			minimum: z.enum(["MEMBER", "ADMIN", "OWNER"]).optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		const access = await getWorkspaceAccess(
			context.user,
			data.code,
			data.minimum,
		);
		return {
			role: access.role,
			workspace: {
				id: access.workspace.id,
				code: access.workspace.code,
				name: access.workspace.name,
				color: access.workspace.color,
			},
			user: {
				id: access.user.id,
				name: access.user.name,
				email: access.user.email,
				image: access.user.image,
			},
		};
	});

export const createWorkspaceFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(createWorkspaceSchema)
	.handler(async ({ data, context }) => {
		try {
			await assertCanJoinWorkspace(context.user.id);
			const code = normalizeWorkspaceCode(data.code);

			const [created] = await db
				.insert(workspace)
				.values({
					name: data.name.trim(),
					color: data.color,
					code,
				})
				.returning({ id: workspace.id, code: workspace.code });

			await db.insert(workspaceUser).values({
				workspaceId: created.id,
				userId: context.user.id,
				role: "OWNER",
			});

			return { success: true as const, data: created };
		} catch (error) {
			return mapActionError(
				error,
				"Failed to create workspace",
				"That workspace code is already taken",
			);
		}
	});

export const updateWorkspaceFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			input: updateWorkspaceSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const { workspace: current } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
				"OWNER",
			);
			const nextCode = normalizeWorkspaceCode(data.input.code);

			const [updated] = await db
				.update(workspace)
				.set({
					name: data.input.name.trim(),
					color: data.input.color,
					code: nextCode,
				})
				.where(eq(workspace.id, current.id))
				.returning({ id: workspace.id, code: workspace.code });

			return { success: true as const, data: updated };
		} catch (error) {
			return mapActionError(
				error,
				"Failed to update workspace",
				"That workspace code is already taken",
			);
		}
	});

export const deleteWorkspaceFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(z.object({ workspaceCode: z.string() }))
	.handler(async ({ data, context }) => {
		try {
			const { workspace: current } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
				"OWNER",
			);

			await db.delete(workspace).where(eq(workspace.id, current.id));

			return { success: true as const, data: { id: current.id } };
		} catch (error) {
			return mapActionError(error, "Failed to delete workspace");
		}
	});
