import type { User } from "better-auth";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { document } from "#/db/schema";
import { getWorkspaceAccess } from "./require-workspace-access";

export type DocumentListItem = {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
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

	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	}));
}
