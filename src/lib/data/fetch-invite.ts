import { eq } from "drizzle-orm";
import { db } from "#/db";
import { workspace, workspaceInvite } from "#/db/schema";

export async function fetchInviteByToken(token: string) {
	const [row] = await db
		.select({
			token: workspaceInvite.token,
			email: workspaceInvite.email,
			role: workspaceInvite.role,
			expiresAt: workspaceInvite.expiresAt,
			workspaceName: workspace.name,
		})
		.from(workspaceInvite)
		.innerJoin(workspace, eq(workspaceInvite.workspaceId, workspace.id))
		.where(eq(workspaceInvite.token, token))
		.limit(1);

	if (!row || row.expiresAt < new Date()) {
		return null;
	}

	return {
		token: row.token,
		email: row.email,
		role: row.role,
		workspaceName: row.workspaceName,
		expiresAt: row.expiresAt.toISOString(),
	};
}
