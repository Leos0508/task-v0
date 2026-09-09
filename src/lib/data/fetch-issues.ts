import type { User } from "better-auth";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import {
	type IssuePriority,
	type IssueStatus,
	issue,
	issueTag,
	tag,
	user as userTable,
} from "#/db/schema";
import { toIssueDateTimeIso } from "#/lib/issue-datetime";
import type { IssueTag } from "./fetch-tags";
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
	tags: IssueTag[];
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

	const tagRows =
		rows.length === 0
			? []
			: await db
					.select({
						issueId: issueTag.issueId,
						id: tag.id,
						name: tag.name,
						color: tag.color,
					})
					.from(issueTag)
					.innerJoin(tag, eq(issueTag.tagId, tag.id))
					.where(eq(tag.workspaceId, workspace.id))
					.orderBy(asc(tag.name));

	const tagsByIssue = new Map<string, IssueTag[]>();
	for (const row of tagRows) {
		const current = tagsByIssue.get(row.issueId) ?? [];
		current.push({ id: row.id, name: row.name, color: row.color });
		tagsByIssue.set(row.issueId, current);
	}

	return rows.map((row) => ({
		id: row.id,
		number: row.number,
		title: row.title,
		status: row.status,
		priority: row.priority,
		startDate: toIssueDateTimeIso(row.startDate),
		endDate: toIssueDateTimeIso(row.endDate),
		rank: row.rank,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		reporterName: row.reporterName,
		tags: tagsByIssue.get(row.id) ?? [],
	}));
}
