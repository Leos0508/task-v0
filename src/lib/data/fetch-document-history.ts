import type { User } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { document, documentHistory, user as userTable } from "#/db/schema";
import { AppError } from "#/types/result";
import {
	type ChangeHistoryItem,
	HISTORY_FIELDS,
	type HistoryField,
} from "./change-history";
import { getWorkspaceAccess } from "./require-workspace-access";

function isHistoryField(value: string): value is HistoryField {
	return (HISTORY_FIELDS as readonly string[]).includes(value);
}

export async function fetchDocumentHistory(
	sessionUser: User,
	workspaceCode: string,
	documentId: string,
): Promise<ChangeHistoryItem[]> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [existing] = await db
		.select({ id: document.id })
		.from(document)
		.where(
			and(eq(document.id, documentId), eq(document.workspaceId, workspace.id)),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Document not found");
	}

	const rows = await db
		.select({
			id: documentHistory.id,
			field: documentHistory.field,
			oldValue: documentHistory.oldValue,
			newValue: documentHistory.newValue,
			createdAt: documentHistory.createdAt,
			actorId: userTable.id,
			actorName: userTable.name,
		})
		.from(documentHistory)
		.innerJoin(userTable, eq(documentHistory.actorId, userTable.id))
		.where(eq(documentHistory.documentId, existing.id))
		.orderBy(desc(documentHistory.createdAt), desc(documentHistory.id));

	return rows.flatMap((row) => {
		if (!isHistoryField(row.field)) return [];
		return [
			{
				id: row.id,
				field: row.field,
				oldValue: row.oldValue,
				newValue: row.newValue,
				createdAt: row.createdAt.toISOString(),
				actor: {
					id: row.actorId,
					name: row.actorName,
				},
			},
		];
	});
}
