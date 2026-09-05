import type { User } from "better-auth";
import { desc, eq } from "drizzle-orm";
import { db } from "#/db";
import {
	type IssuePriority,
	type IssueStatus,
	issue,
	user as userTable,
} from "#/db/schema";
import { getWorkspaceAccess } from "./require-workspace-access";

export type IssueListItem = {
	id: string;
	number: number;
	title: string;
	status: IssueStatus;
	priority: IssuePriority | null;
	startDate: string | null;
	endDate: string | null;
	rank: number;
	createdAt: string;
	updatedAt: string;
	reporterName: string;
};

export async function fetchIssues(
	sessionUser: User,
	workspaceCode: string,
): Promise<IssueListItem[]> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const rows = await db
		.select({
			id: issue.id,
			number: issue.number,
			title: issue.title,
			status: issue.status,
			priority: issue.priority,
			startDate: issue.startDate,
			endDate: issue.endDate,
			rank: issue.rank,
			createdAt: issue.createdAt,
			updatedAt: issue.updatedAt,
			reporterName: userTable.name,
		})
		.from(issue)
		.innerJoin(userTable, eq(issue.reporterId, userTable.id))
		.where(eq(issue.workspaceId, workspace.id))
		.orderBy(desc(issue.number));

	return rows.map((row) => ({
		id: row.id,
		number: row.number,
		title: row.title,
		status: row.status,
		priority: row.priority,
		startDate: row.startDate ?? null,
		endDate: row.endDate ?? null,
		rank: row.rank,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		reporterName: row.reporterName,
	}));
}
