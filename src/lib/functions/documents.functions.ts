import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { document, issue, issueDocument } from "#/db/schema";
import {
	emptyDocumentDescription,
	updateDocumentSchema,
} from "#/features/documents/schema";
import { fetchDocument } from "#/lib/data/fetch-document";
import { fetchDocuments } from "#/lib/data/fetch-documents";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { mapActionError } from "#/lib/map-action-error";
import { authMiddleware } from "#/middlewares/auth-middleware";
import { AppError } from "#/types/result";

export const listDocumentsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ code: z.string() }))
	.handler(async ({ data, context }) =>
		fetchDocuments(context.user, data.code),
	);

export const getDocumentFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ code: z.string(), id: z.string() }))
	.handler(async ({ data, context }) =>
		fetchDocument(context.user, data.code, data.id),
	);

export const createDocumentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(z.object({ workspaceCode: z.string() }))
	.handler(async ({ data, context }) => {
		try {
			const { workspace } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
			);

			const [created] = await db
				.insert(document)
				.values({
					title: "New Document",
					description: emptyDocumentDescription,
					workspaceId: workspace.id,
				})
				.returning({ id: document.id });

			return { success: true as const, data: created };
		} catch (error) {
			return mapActionError(error, "Failed to create document");
		}
	});

export const updateDocumentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			documentId: z.string(),
			input: updateDocumentSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const { workspace } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
			);

			const [existing] = await db
				.select({ id: document.id })
				.from(document)
				.where(
					and(
						eq(document.id, data.documentId),
						eq(document.workspaceId, workspace.id),
					),
				)
				.limit(1);

			if (!existing) {
				throw new AppError("NOT_FOUND", "Document not found");
			}

			const patch: { title?: string; description?: unknown } = {};
			if (data.input.title !== undefined) {
				patch.title = data.input.title.trim();
			}
			if (data.input.description !== undefined) {
				patch.description = JSON.parse(JSON.stringify(data.input.description));
			}

			const [updated] = await db
				.update(document)
				.set(patch)
				.where(eq(document.id, existing.id))
				.returning({ id: document.id, updatedAt: document.updatedAt });

			return {
				success: true as const,
				data: { id: updated.id, updatedAt: updated.updatedAt.toISOString() },
			};
		} catch (error) {
			return mapActionError(error, "Failed to update document");
		}
	});

export const deleteDocumentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			documentId: z.string(),
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
				.select({ id: document.id })
				.from(document)
				.where(
					and(
						eq(document.id, data.documentId),
						eq(document.workspaceId, workspace.id),
					),
				)
				.limit(1);

			if (!existing) {
				throw new AppError("NOT_FOUND", "Document not found");
			}

			await db.delete(document).where(eq(document.id, existing.id));

			return { success: true as const, data: { id: existing.id } };
		} catch (error) {
			return mapActionError(error, "Failed to delete document");
		}
	});

export const linkIssueToDocumentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			documentId: z.string(),
			issueNumber: z.number().int().positive(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const { workspace } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
			);

			const [[doc], [linkedIssue]] = await Promise.all([
				db
					.select({ id: document.id })
					.from(document)
					.where(
						and(
							eq(document.id, data.documentId),
							eq(document.workspaceId, workspace.id),
						),
					)
					.limit(1),
				db
					.select({
						id: issue.id,
						number: issue.number,
						title: issue.title,
						status: issue.status,
					})
					.from(issue)
					.where(
						and(
							eq(issue.workspaceId, workspace.id),
							eq(issue.number, data.issueNumber),
						),
					)
					.limit(1),
			]);

			if (!doc) {
				throw new AppError("NOT_FOUND", "Document not found");
			}
			if (!linkedIssue) {
				throw new AppError("NOT_FOUND", "Issue not found");
			}

			await db.insert(issueDocument).values({
				documentId: doc.id,
				issueId: linkedIssue.id,
			});

			return { success: true as const, data: linkedIssue };
		} catch (error) {
			return mapActionError(
				error,
				"Failed to link issue",
				"This issue is already linked",
			);
		}
	});

export const unlinkIssueFromDocumentFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			documentId: z.string(),
			issueNumber: z.number().int().positive(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const { workspace } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
			);

			const [[doc], [linkedIssue]] = await Promise.all([
				db
					.select({ id: document.id })
					.from(document)
					.where(
						and(
							eq(document.id, data.documentId),
							eq(document.workspaceId, workspace.id),
						),
					)
					.limit(1),
				db
					.select({ id: issue.id, number: issue.number })
					.from(issue)
					.where(
						and(
							eq(issue.workspaceId, workspace.id),
							eq(issue.number, data.issueNumber),
						),
					)
					.limit(1),
			]);

			if (!doc) {
				throw new AppError("NOT_FOUND", "Document not found");
			}
			if (!linkedIssue) {
				throw new AppError("NOT_FOUND", "Issue not found");
			}

			const [existing] = await db
				.select({ id: issueDocument.id })
				.from(issueDocument)
				.where(
					and(
						eq(issueDocument.issueId, linkedIssue.id),
						eq(issueDocument.documentId, doc.id),
					),
				)
				.limit(1);

			if (!existing) {
				throw new AppError("NOT_FOUND", "Link not found");
			}

			await db.delete(issueDocument).where(eq(issueDocument.id, existing.id));

			return { success: true as const, data: { issueId: linkedIssue.id } };
		} catch (error) {
			return mapActionError(error, "Failed to unlink issue");
		}
	});
