import type { User } from "better-auth";
import { db } from "#/db";
import { tag } from "#/db/schema";
import type { CreateTagInput } from "#/features/issues/schema";
import { getRandomTagColorId } from "#/features/issues/tag-colors";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function createTag(
	sessionUser: User,
	workspaceCode: string,
	input: CreateTagInput,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [row] = await db
		.insert(tag)
		.values({
			workspaceId: workspace.id,
			name: input.name,
			color: input.color ?? getRandomTagColorId(),
		})
		.returning({
			id: tag.id,
			name: tag.name,
			color: tag.color,
		});

	if (!row) {
		throw new AppError("UNKNOWN", "Failed to create tag");
	}

	return row;
}
