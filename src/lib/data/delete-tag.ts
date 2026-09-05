import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { tag } from "#/db/schema";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function deleteTag(
	sessionUser: User,
	workspaceCode: string,
	tagId: string,
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

	await db.delete(tag).where(eq(tag.id, existing.id));

	return { id: existing.id };
}
