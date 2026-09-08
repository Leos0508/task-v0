import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createTagSchema, updateTagSchema } from "#/features/issues/schema";
import { createTag } from "#/lib/data/create-tag";
import { deleteTag } from "#/lib/data/delete-tag";
import { fetchTags } from "#/lib/data/fetch-tags";
import { linkTagToDocument } from "#/lib/data/link-tag-to-document";
import { linkTagToIssue } from "#/lib/data/link-tag-to-issue";
import { unlinkTagFromDocument } from "#/lib/data/unlink-tag-from-document";
import { unlinkTagFromIssue } from "#/lib/data/unlink-tag-from-issue";
import { updateTag } from "#/lib/data/update-tag";
import { mapActionError } from "#/lib/map-action-error";
import { authMiddleware } from "#/middlewares/auth-middleware";

export const listTagsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ code: z.string() }))
	.handler(async ({ data, context }) => fetchTags(context.user, data.code));

export const createTagFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			input: createTagSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const created = await createTag(
				context.user,
				data.workspaceCode,
				data.input,
			);
			return { success: true as const, data: created };
		} catch (error) {
			return mapActionError(
				error,
				"Failed to create tag",
				"A tag with this name already exists",
			);
		}
	});

export const updateTagFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			tagId: z.string().min(1),
			input: updateTagSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const updated = await updateTag(
				context.user,
				data.workspaceCode,
				data.tagId,
				data.input,
			);
			return { success: true as const, data: updated };
		} catch (error) {
			return mapActionError(
				error,
				"Failed to update tag",
				"A tag with this name already exists",
			);
		}
	});

export const deleteTagFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			tagId: z.string().min(1),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const deleted = await deleteTag(
				context.user,
				data.workspaceCode,
				data.tagId,
			);
			return { success: true as const, data: deleted };
		} catch (error) {
			return mapActionError(error, "Failed to delete tag");
		}
	});

export const linkTagToIssueFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			issueNumber: z.number().int().positive(),
			tagId: z.string().min(1),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const linked = await linkTagToIssue(
				context.user,
				data.workspaceCode,
				data.issueNumber,
				data.tagId,
			);
			return { success: true as const, data: linked };
		} catch (error) {
			return mapActionError(
				error,
				"Failed to add tag",
				"This tag is already on the issue",
			);
		}
	});

export const unlinkTagFromIssueFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			issueNumber: z.number().int().positive(),
			tagId: z.string().min(1),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const unlinked = await unlinkTagFromIssue(
				context.user,
				data.workspaceCode,
				data.issueNumber,
				data.tagId,
			);
			return { success: true as const, data: unlinked };
		} catch (error) {
			return mapActionError(error, "Failed to remove tag");
		}
	});

export const linkTagToDocumentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			documentId: z.string().min(1),
			tagId: z.string().min(1),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const linked = await linkTagToDocument(
				context.user,
				data.workspaceCode,
				data.documentId,
				data.tagId,
			);
			return { success: true as const, data: linked };
		} catch (error) {
			return mapActionError(
				error,
				"Failed to add tag",
				"This tag is already on the document",
			);
		}
	});

export const unlinkTagFromDocumentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			documentId: z.string().min(1),
			tagId: z.string().min(1),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const unlinked = await unlinkTagFromDocument(
				context.user,
				data.workspaceCode,
				data.documentId,
				data.tagId,
			);
			return { success: true as const, data: unlinked };
		} catch (error) {
			return mapActionError(error, "Failed to remove tag");
		}
	});
