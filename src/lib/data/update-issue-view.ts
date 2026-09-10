import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { issueView } from "#/db/schema";
import type { UpdateIssueViewInput } from "#/features/issues/schema";
import { canManageIssueView } from "#/lib/authz/roles";
import { AppError } from "#/types/result";
import { parseIssueViewConfig } from "./parse-issue-view-config";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function updateIssueView(
	sessionUser: User,
	workspaceCode: string,
	viewId: string,
	input: UpdateIssueViewInput,
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

	const [row] = await db
		.update(issueView)
		.set({
			...(input.name !== undefined ? { name: input.name } : {}),
			...(input.config !== undefined ? { config: input.config } : {}),
		})
		.where(eq(issueView.id, existing.id))
		.returning({
			id: issueView.id,
			name: issueView.name,
			createdById: issueView.createdById,
			config: issueView.config,
			createdAt: issueView.createdAt,
			updatedAt: issueView.updatedAt,
		});

	const config = row ? parseIssueViewConfig(row.config) : null;
	if (!row || !config) {
		throw new AppError("UNKNOWN", "Failed to update view");
	}

	return {
		id: row.id,
		name: row.name,
		createdById: row.createdById,
		config,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}
