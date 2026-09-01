import type { User } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { document, issue, issueDocument, user as userTable } from "#/db/schema";
import type { JsonValue } from "#/types/json";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export type IssueLinkedDocument = {
	id: string;
	title: string;
	updatedAt: string;
};

export async function fetchIssue(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [row] = await db
		.select({
			id: issue.id,
			number: issue.number,
			title: issue.title,
			description: issue.description,
			status: issue.status,
			priority: issue.priority,
			startDate: issue.startDate,
			endDate: issue.endDate,
			createdAt: issue.createdAt,
			updatedAt: issue.updatedAt,
			reporterName: userTable.name,
		})
		.from(issue)
		.innerJoin(userTable, eq(issue.reporterId, userTable.id))
		.where(
			and(eq(issue.workspaceId, workspace.id), eq(issue.number, issueNumber)),
		)
		.limit(1);

	if (!row) {
		throw new AppError("NOT_FOUND", "Issue not found");
	}

	const linked = await db
		.select({
			id: document.id,
			title: document.title,
			updatedAt: document.updatedAt,
		})
		.from(issueDocument)
		.innerJoin(document, eq(issueDocument.documentId, document.id))
		.where(eq(issueDocument.issueId, row.id))
		.orderBy(desc(issueDocument.createdAt));

	return {
		id: row.id,
		number: row.number,
		title: row.title,
		description: (row.description ?? null) as JsonValue | null,
		status: row.status,
		priority: row.priority,
		startDate: row.startDate ?? null,
		endDate: row.endDate ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		reporter: { name: row.reporterName },
		linkedDocuments: linked.map((item) => ({
			id: item.id,
			title: item.title,
			updatedAt: item.updatedAt.toISOString(),
		})),
	};
}
