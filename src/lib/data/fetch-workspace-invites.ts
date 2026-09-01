import type { User } from "better-auth";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { type WorkspaceRole, workspaceInvite } from "#/db/schema";
import { getWorkspaceAccess } from "./require-workspace-access";

export type WorkspaceInviteItem = {
	id: string;
	email: string;
	role: WorkspaceRole;
	token: string;
	expiresAt: string;
	createdAt: string;
};

export async function fetchWorkspaceInvites(
	sessionUser: User,
	workspaceCode: string,
): Promise<WorkspaceInviteItem[]> {
	const { workspace } = await getWorkspaceAccess(
		sessionUser,
		workspaceCode,
		"ADMIN",
	);

	const rows = await db
		.select()
		.from(workspaceInvite)
		.where(eq(workspaceInvite.workspaceId, workspace.id))
		.orderBy(desc(workspaceInvite.createdAt));

	return rows.map((invite) => ({
		id: invite.id,
		email: invite.email,
		role: invite.role,
		token: invite.token,
		expiresAt: invite.expiresAt.toISOString(),
		createdAt: invite.createdAt.toISOString(),
	}));
}
