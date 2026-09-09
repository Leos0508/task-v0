import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { document } from "#/db/schema";
import type { UpdateDocumentInput } from "#/features/documents/schema";
import {
	type HistoryChange,
	insertDocumentHistory,
	sameJson,
	tipTapText,
} from "#/lib/data/change-history";
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
		.select({
			id: document.id,
			title: document.title,
			description: document.description,
			updatedAt: document.updatedAt,
		})
		.from(document)
		.where(
			and(eq(document.id, documentId), eq(document.workspaceId, workspace.id)),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Document not found");
	}

	const patch: { title?: string; description?: unknown } = {};
	const changes: HistoryChange[] = [];

	if (input.title !== undefined) {
		const title = input.title.trim();
		if (title !== existing.title) {
			patch.title = title;
			changes.push({
				field: "title",
				oldValue: existing.title,
				newValue: title,
			});
		}
	}
	if (
		input.description !== undefined &&
		!sameJson(existing.description, input.description)
	) {
		patch.description = JSON.parse(JSON.stringify(input.description));
		if (tipTapText(existing.description) !== tipTapText(input.description)) {
			changes.push({
				field: "description",
				oldValue: null,
				newValue: null,
			});
		}
	}

	if (Object.keys(patch).length === 0) {
		return { id: existing.id, updatedAt: existing.updatedAt.toISOString() };
	}

	const [updated] = await db
		.update(document)
		.set(patch)
		.where(eq(document.id, existing.id))
		.returning({ id: document.id, updatedAt: document.updatedAt });

	await insertDocumentHistory(existing.id, sessionUser.id, changes);

	return { id: updated.id, updatedAt: updated.updatedAt.toISOString() };
}
