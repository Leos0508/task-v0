import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { document } from "#/db/schema";
import type { UpdateDocumentInput } from "#/features/documents/schema";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { AppError } from "#/types/result";

export async function updateDocument(
	sessionUser: User,
	workspaceCode: string,
	documentId: string,
	input: UpdateDocumentInput,
) {
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

	const patch: { title?: string; description?: unknown } = {};
	if (input.title !== undefined) {
		patch.title = input.title.trim();
	}
	if (input.description !== undefined) {
		patch.description = JSON.parse(JSON.stringify(input.description));
	}

	const [updated] = await db
		.update(document)
		.set(patch)
		.where(eq(document.id, existing.id))
		.returning({ id: document.id, updatedAt: document.updatedAt });

	return { id: updated.id, updatedAt: updated.updatedAt.toISOString() };
}
