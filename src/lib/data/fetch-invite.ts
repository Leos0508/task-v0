import { eq } from "drizzle-orm";
import { db } from "#/db";
import { workspace, workspaceInvite } from "#/db/schema";
import { countWorkspaceMembers } from "#/lib/limits";
import { MAX_MEMBERS_PER_WORKSPACE } from "#/lib/quota";

export async function fetchInviteByToken(token: string) {
	const [row] = await db
		.select({
			token: workspaceInvite.token,
			email: workspaceInvite.email,
			role: workspaceInvite.role,
			expiresAt: workspaceInvite.expiresAt,
			workspaceId: workspaceInvite.workspaceId,
			workspaceName: workspace.name,
		})
		.from(workspaceInvite)
		.innerJoin(workspace, eq(workspaceInvite.workspaceId, workspace.id))
		.where(eq(workspaceInvite.token, token))
		.limit(1);

	if (!row || row.expiresAt < new Date()) {
		return null;
	}

	const memberCount = await countWorkspaceMembers(row.workspaceId);

	return {
		token: row.token,
		email: row.email,
		role: row.role,
		workspaceName: row.workspaceName,
		memberCount,
		memberLimit: MAX_MEMBERS_PER_WORKSPACE,
		expiresAt: row.expiresAt.toISOString(),
	};
}
