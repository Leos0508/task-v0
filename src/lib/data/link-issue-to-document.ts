import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { document, issue, issueDocument } from "#/db/schema";
import {
	insertDocumentHistory,
	insertIssueHistory,
} from "#/lib/data/change-history";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { issueCode } from "#/lib/workspace-path";
import { AppError } from "#/types/result";

export async function linkIssueToDocument(
	sessionUser: User,
	workspaceCode: string,
	documentId: string,
	issueNumber: number,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [[doc], [linkedIssue]] = await Promise.all([
		db
			.select({ id: document.id, title: document.title })
			.from(document)
			.where(
				and(
					eq(document.id, documentId),
					eq(document.workspaceId, workspace.id),
				),
			)
			.limit(1),
		db
			.select({
				id: issue.id,
				number: issue.number,
				title: issue.title,
				status: issue.status,
			})
			.from(issue)
			.where(
				and(eq(issue.workspaceId, workspace.id), eq(issue.number, issueNumber)),
			)
			.limit(1),
	]);

	if (!doc) {
		throw new AppError("NOT_FOUND", "Document not found");
	}
	if (!linkedIssue) {
		throw new AppError("NOT_FOUND", "Issue not found");
	}

	await db.insert(issueDocument).values({
		documentId: doc.id,
		issueId: linkedIssue.id,
	});

	const issueLabel = `${issueCode(workspace.code, linkedIssue.number)} ${linkedIssue.title}`;
	await Promise.all([
		insertIssueHistory(linkedIssue.id, sessionUser.id, [
			{ field: "document", oldValue: null, newValue: doc.title },
		]),
		insertDocumentHistory(doc.id, sessionUser.id, [
			{ field: "issue", oldValue: null, newValue: issueLabel },
		]),
	]);

	return linkedIssue;
}
