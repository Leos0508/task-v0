import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	createCommentSchema,
	updateCommentSchema,
} from "#/features/issues/schema";
import { createComment } from "#/lib/data/create-comment";
import { deleteComment } from "#/lib/data/delete-comment";
import { fetchIssueComments } from "#/lib/data/fetch-issue-comments";
import { updateComment } from "#/lib/data/update-comment";
import { mapActionError } from "#/lib/map-action-error";
import { authMiddleware } from "#/middlewares/auth-middleware";

const issueCommentTargetSchema = z.object({
	workspaceCode: z.string(),
	issueNumber: z.number().int().positive(),
});

export const listIssueCommentsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(issueCommentTargetSchema)
	.handler(async ({ data, context }) =>
		fetchIssueComments(context.user, data.workspaceCode, data.issueNumber),
	);

export const createCommentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		issueCommentTargetSchema.extend({
			input: createCommentSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const created = await createComment(
				context.user,
				data.workspaceCode,
				data.issueNumber,
				data.input,
			);
			return { success: true as const, data: created };
		} catch (error) {
			return mapActionError(error, "Failed to add comment");
		}
	});

export const updateCommentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		issueCommentTargetSchema.extend({
			commentId: z.string().min(1),
			input: updateCommentSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const updated = await updateComment(
				context.user,
				data.workspaceCode,
				data.issueNumber,
				data.commentId,
				data.input,
			);
			return { success: true as const, data: updated };
		} catch (error) {
			return mapActionError(error, "Failed to update comment");
		}
	});

export const deleteCommentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		issueCommentTargetSchema.extend({
			commentId: z.string().min(1),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const deleted = await deleteComment(
				context.user,
				data.workspaceCode,
				data.issueNumber,
				data.commentId,
			);
			return { success: true as const, data: deleted };
		} catch (error) {
			return mapActionError(error, "Failed to delete comment");
		}
	});
