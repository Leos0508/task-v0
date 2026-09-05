import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { tag } from "#/db/schema";
import type { UpdateTagInput } from "#/features/issues/schema";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function updateTag(
	sessionUser: User,
	workspaceCode: string,
	tagId: string,
	input: UpdateTagInput,
) {
	const { workspace } = await getWorkspaceAccess(
		sessionUser,
		workspaceCode,
		"ADMIN",
	);

	const [existing] = await db
		.select({ id: tag.id })
		.from(tag)
		.where(and(eq(tag.id, tagId), eq(tag.workspaceId, workspace.id)))
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Tag not found");
	}

	const [row] = await db
		.update(tag)
		.set({
			...(input.name !== undefined ? { name: input.name } : {}),
			...(input.color !== undefined ? { color: input.color } : {}),
		})
		.where(eq(tag.id, existing.id))
		.returning({
			id: tag.id,
			name: tag.name,
			color: tag.color,
		});

	if (!row) {
		throw new AppError("UNKNOWN", "Failed to update tag");
	}

	return row;
}
