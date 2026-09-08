import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { document, documentTag, tag } from "#/db/schema";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function linkTagToDocument(
	sessionUser: User,
	workspaceCode: string,
	documentId: string,
	tagId: string,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [[existingTag], [existingDocument]] = await Promise.all([
		db
			.select({
				id: tag.id,
				name: tag.name,
				color: tag.color,
			})
			.from(tag)
			.where(and(eq(tag.id, tagId), eq(tag.workspaceId, workspace.id)))
			.limit(1),
		db
			.select({ id: document.id })
			.from(document)
			.where(
				and(
					eq(document.workspaceId, workspace.id),
					eq(document.id, documentId),
				),
			)
			.limit(1),
	]);

	if (!existingTag) {
		throw new AppError("NOT_FOUND", "Tag not found");
	}
	if (!existingDocument) {
		throw new AppError("NOT_FOUND", "Document not found");
	}

	await db.insert(documentTag).values({
		tagId: existingTag.id,
		documentId: existingDocument.id,
	});

	return existingTag;
}
