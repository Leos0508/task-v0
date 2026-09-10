import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	createIssueViewSchema,
	updateIssueViewSchema,
} from "#/features/issues/schema";
import { createIssueView } from "#/lib/data/create-issue-view";
import { deleteIssueView } from "#/lib/data/delete-issue-view";
import { fetchIssueViews } from "#/lib/data/fetch-issue-views";
import { updateIssueView } from "#/lib/data/update-issue-view";
import { mapActionError } from "#/lib/map-action-error";
import { authMiddleware } from "#/middlewares/auth-middleware";

export const listIssueViewsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ code: z.string() }))
	.handler(async ({ data, context }) =>
		fetchIssueViews(context.user, data.code),
	);

export const createIssueViewFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			input: createIssueViewSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const created = await createIssueView(
				context.user,
				data.workspaceCode,
				data.input,
			);
			return { success: true as const, data: created };
		} catch (error) {
			return mapActionError(
				error,
				"Failed to create view",
				"A view with this name already exists",
			);
		}
	});

export const updateIssueViewFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			viewId: z.string().min(1),
			input: updateIssueViewSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const updated = await updateIssueView(
				context.user,
				data.workspaceCode,
				data.viewId,
				data.input,
			);
			return { success: true as const, data: updated };
		} catch (error) {
			return mapActionError(
				error,
				"Failed to update view",
				"A view with this name already exists",
			);
		}
	});

export const deleteIssueViewFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			viewId: z.string().min(1),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const deleted = await deleteIssueView(
				context.user,
				data.workspaceCode,
				data.viewId,
			);
			return { success: true as const, data: deleted };
		} catch (error) {
			return mapActionError(error, "Failed to delete view");
		}
	});
