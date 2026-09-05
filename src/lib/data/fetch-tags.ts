import type { User } from "better-auth";
import { asc, eq } from "drizzle-orm";
import { db } from "#/db";
import { tag } from "#/db/schema";
import { getWorkspaceAccess } from "./require-workspace-access";

export type IssueTag = {
	id: string;
	name: string;
	color: string;
};

export async function fetchTags(
	sessionUser: User,
	workspaceCode: string,
): Promise<IssueTag[]> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const rows = await db
		.select({
			id: tag.id,
			name: tag.name,
			color: tag.color,
		})
		.from(tag)
		.where(eq(tag.workspaceId, workspace.id))
		.orderBy(asc(tag.name));

	return rows;
}
