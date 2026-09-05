import type { User } from "better-auth";
import { db } from "#/db";
import { document } from "#/db/schema";
import { emptyDocumentDescription } from "#/features/documents/schema";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";

export type CreateDocumentInput = {
	title?: string;
	description?: unknown;
};

export async function createDocument(
	sessionUser: User,
	workspaceCode: string,
	input?: CreateDocumentInput,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);
	const title = input?.title?.trim() || "New Document";

	const [created] = await db
		.insert(document)
		.values({
			title,
			description:
				input?.description === undefined
					? emptyDocumentDescription
					: JSON.parse(JSON.stringify(input.description)),
			workspaceId: workspace.id,
		})
		.returning({ id: document.id });

	return created;
}
