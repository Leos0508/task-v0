import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { type WorkspaceRole, workspace, workspaceUser } from "#/db/schema";
import { hasAtLeast } from "#/lib/authz/roles";
import { normalizeWorkspaceCode } from "#/lib/workspace-code";
import { AppError } from "#/types/result";

export async function getWorkspaceAccess(
	user: User,
	workspaceCode: string,
	minimum?: WorkspaceRole,
) {
	const code = normalizeWorkspaceCode(workspaceCode);

	if (!code) {
		throw new AppError("NOT_FOUND", "Workspace not found");
	}

	const [row] = await db
		.select({
			membership: workspaceUser,
			workspace,
		})
		.from(workspaceUser)
		.innerJoin(workspace, eq(workspaceUser.workspaceId, workspace.id))
		.where(and(eq(workspaceUser.userId, user.id), eq(workspace.code, code)))
		.limit(1);

	if (!row) {
		throw new AppError("NOT_FOUND", "Workspace not found");
	}

	if (minimum && !hasAtLeast(row.membership.role, minimum)) {
		throw new AppError(
			"FORBIDDEN",
			"You do not have permission to do that in this workspace",
		);
	}

	return {
		user,
		role: row.membership.role,
		membership: row.membership,
		workspace: row.workspace,
	};
}
