import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { document, documentTag, tag } from "#/db/schema";
import { insertDocumentHistory } from "#/lib/data/change-history";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function unlinkTagFromDocument(
	sessionUser: User,
	workspaceCode: string,
	documentId: string,
	tagId: string,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [[existingTag], [existingDocument]] = await Promise.all([
		db
			.select({ id: tag.id, name: tag.name })
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

	const [existing] = await db
		.select({ id: documentTag.id })
		.from(documentTag)
		.where(
			and(
				eq(documentTag.documentId, existingDocument.id),
				eq(documentTag.tagId, existingTag.id),
			),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Tag is not on this document");
	}

	await db.delete(documentTag).where(eq(documentTag.id, existing.id));

	await insertDocumentHistory(existingDocument.id, sessionUser.id, [
		{ field: "tag", oldValue: existingTag.name, newValue: null },
	]);

	return { tagId: existingTag.id };
}
