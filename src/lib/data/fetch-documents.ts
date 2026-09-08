import type { User } from "better-auth";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { document, documentTag, tag } from "#/db/schema";
import type { IssueTag } from "./fetch-tags";
import { getWorkspaceAccess } from "./require-workspace-access";

export type DocumentListItem = {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	tags: IssueTag[];
};

export async function fetchDocuments(
	sessionUser: User,
	workspaceCode: string,
): Promise<DocumentListItem[]> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const rows = await db
		.select({
			id: document.id,
			title: document.title,
			createdAt: document.createdAt,
			updatedAt: document.updatedAt,
		})
		.from(document)
		.where(eq(document.workspaceId, workspace.id))
		.orderBy(desc(document.createdAt));

	const tagRows =
		rows.length === 0
			? []
			: await db
					.select({
						documentId: documentTag.documentId,
						id: tag.id,
						name: tag.name,
						color: tag.color,
					})
					.from(documentTag)
					.innerJoin(tag, eq(documentTag.tagId, tag.id))
					.where(eq(tag.workspaceId, workspace.id))
					.orderBy(asc(tag.name));

	const tagsByDocument = new Map<string, IssueTag[]>();
	for (const row of tagRows) {
		const current = tagsByDocument.get(row.documentId) ?? [];
		current.push({ id: row.id, name: row.name, color: row.color });
		tagsByDocument.set(row.documentId, current);
	}

	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		tags: tagsByDocument.get(row.id) ?? [],
	}));
}
