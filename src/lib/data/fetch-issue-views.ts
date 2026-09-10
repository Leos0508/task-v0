import type { User } from "better-auth";
import { asc, eq } from "drizzle-orm";
import { db } from "#/db";
import { issueView } from "#/db/schema";
import type { IssueViewConfig } from "#/features/issues/schema";
import { parseIssueViewConfig } from "./parse-issue-view-config";
import { getWorkspaceAccess } from "./require-workspace-access";

export type IssueViewListItem = {
	id: string;
	name: string;
	createdById: string;
	config: IssueViewConfig;
	createdAt: string;
	updatedAt: string;
};

export async function fetchIssueViews(
	sessionUser: User,
	workspaceCode: string,
): Promise<IssueViewListItem[]> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const rows = await db
		.select({
			id: issueView.id,
			name: issueView.name,
			createdById: issueView.createdById,
			config: issueView.config,
			createdAt: issueView.createdAt,
			updatedAt: issueView.updatedAt,
		})
		.from(issueView)
		.where(eq(issueView.workspaceId, workspace.id))
		.orderBy(asc(issueView.name));

	const views: IssueViewListItem[] = [];
	for (const row of rows) {
		const config = parseIssueViewConfig(row.config);
		if (!config) continue;
		views.push({
			id: row.id,
			name: row.name,
			createdById: row.createdById,
			config,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
		});
	}
	return views;
}
