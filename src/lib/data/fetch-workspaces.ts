import type { User } from "better-auth";
import { asc, eq } from "drizzle-orm";
import { db } from "#/db";
import { workspace, workspaceUser } from "#/db/schema";
import type { WorkspaceListItem } from "#/types/workspace";

export async function fetchWorkspaces(
	user: User,
): Promise<WorkspaceListItem[]> {
	const rows = await db
		.select({
			id: workspace.id,
			code: workspace.code,
			name: workspace.name,
			color: workspace.color,
			role: workspaceUser.role,
			createdAt: workspace.createdAt,
		})
		.from(workspaceUser)
		.innerJoin(workspace, eq(workspaceUser.workspaceId, workspace.id))
		.where(eq(workspaceUser.userId, user.id))
		.orderBy(asc(workspace.name));

	return rows.map((row) => ({
		id: row.id,
		code: row.code,
		name: row.name,
		color: row.color,
		role: row.role,
		createdAt: row.createdAt.toISOString(),
	}));
}
