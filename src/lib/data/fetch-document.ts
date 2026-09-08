import type { User } from "better-auth";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import {
	document,
	documentTag,
	type IssueStatus,
	issue,
	issueDocument,
	tag,
} from "#/db/schema";
import type { JsonValue } from "#/types/json";
import { AppError } from "#/types/result";
import type { IssueTag } from "./fetch-tags";
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
	tags: IssueTag[];
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

	const [linked, tags] = await Promise.all([
		db
			.select({
				id: issue.id,
				number: issue.number,
				title: issue.title,
				status: issue.status,
			})
			.from(issueDocument)
			.innerJoin(issue, eq(issueDocument.issueId, issue.id))
			.where(eq(issueDocument.documentId, row.id))
			.orderBy(desc(issueDocument.createdAt)),
		db
			.select({
				id: tag.id,
				name: tag.name,
				color: tag.color,
			})
			.from(documentTag)
			.innerJoin(tag, eq(documentTag.tagId, tag.id))
			.where(eq(documentTag.documentId, row.id))
			.orderBy(asc(tag.name)),
	]);

	return {
		id: row.id,
		title: row.title,
		description: (row.description ?? null) as JsonValue | null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		tags,
		linkedIssues: linked,
	};
}
