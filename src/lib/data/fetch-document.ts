import type { User } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { document, type IssueStatus, issue, issueDocument } from "#/db/schema";
import type { JsonValue } from "#/types/json";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export type DocumentLinkedIssue = {
	id: string;
	number: number;
	title: string;
	status: IssueStatus;
};

export type DocumentDetailItem = {
	id: string;
	title: string;
	description: JsonValue | null;
	createdAt: string;
	updatedAt: string;
	linkedIssues: DocumentLinkedIssue[];
};

export async function fetchDocument(
	sessionUser: User,
	workspaceCode: string,
	documentId: string,
): Promise<DocumentDetailItem> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [row] = await db
		.select()
		.from(document)
		.where(
			and(eq(document.workspaceId, workspace.id), eq(document.id, documentId)),
		)
		.limit(1);

	if (!row) {
		throw new AppError("NOT_FOUND", "Document not found");
	}

	const linked = await db
		.select({
			id: issue.id,
			number: issue.number,
			title: issue.title,
			status: issue.status,
		})
		.from(issueDocument)
		.innerJoin(issue, eq(issueDocument.issueId, issue.id))
		.where(eq(issueDocument.documentId, row.id))
		.orderBy(desc(issueDocument.createdAt));

	return {
		id: row.id,
		title: row.title,
		description: (row.description ?? null) as JsonValue | null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		linkedIssues: linked,
	};
}
