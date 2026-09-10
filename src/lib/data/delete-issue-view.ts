import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { issueView } from "#/db/schema";
import { canManageIssueView } from "#/lib/authz/roles";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function deleteIssueView(
	sessionUser: User,
	workspaceCode: string,
	viewId: string,
) {
	const { workspace, user, role } = await getWorkspaceAccess(
		sessionUser,
		workspaceCode,
	);

	const [existing] = await db
		.select({
			id: issueView.id,
			createdById: issueView.createdById,
		})
		.from(issueView)
		.where(
			and(eq(issueView.id, viewId), eq(issueView.workspaceId, workspace.id)),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "View not found");
	}

	if (!canManageIssueView(role, existing.createdById, user.id)) {
		throw new AppError(
			"FORBIDDEN",
			"You do not have permission to do that in this workspace",
		);
	}

	await db.delete(issueView).where(eq(issueView.id, existing.id));

	return { id: existing.id };
}
