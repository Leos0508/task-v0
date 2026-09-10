import type { User } from "better-auth";
import { db } from "#/db";
import { issueView } from "#/db/schema";
import type { CreateIssueViewInput } from "#/features/issues/schema";
import { AppError } from "#/types/result";
import { parseIssueViewConfig } from "./parse-issue-view-config";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function createIssueView(
	sessionUser: User,
	workspaceCode: string,
	input: CreateIssueViewInput,
) {
	const { workspace, user } = await getWorkspaceAccess(
		sessionUser,
		workspaceCode,
	);

	const [row] = await db
		.insert(issueView)
		.values({
			workspaceId: workspace.id,
			createdById: user.id,
			name: input.name,
			config: input.config,
		})
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
		throw new AppError("UNKNOWN", "Failed to create view");
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
