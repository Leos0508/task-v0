import type { User } from "better-auth";
import { asc, eq } from "drizzle-orm";
import { db } from "#/db";
import {
	user as userTable,
	type WorkspaceRole,
	workspaceUser,
} from "#/db/schema";
import { getWorkspaceAccess } from "./require-workspace-access";

export type WorkspaceMember = {
	id: string;
	userId: string;
	name: string;
	email: string;
	role: WorkspaceRole;
	createdAt: string;
};

export async function fetchWorkspaceMembers(
	sessionUser: User,
	workspaceCode: string,
): Promise<WorkspaceMember[]> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const rows = await db
		.select({
			id: workspaceUser.id,
			userId: userTable.id,
			name: userTable.name,
			email: userTable.email,
			role: workspaceUser.role,
			createdAt: workspaceUser.createdAt,
		})
		.from(workspaceUser)
		.innerJoin(userTable, eq(workspaceUser.userId, userTable.id))
		.where(eq(workspaceUser.workspaceId, workspace.id))
		.orderBy(asc(workspaceUser.createdAt));

	return rows.map((row) => ({
		id: row.id,
		userId: row.userId,
		name: row.name,
		email: row.email,
		role: row.role,
		createdAt: row.createdAt.toISOString(),
	}));
}
