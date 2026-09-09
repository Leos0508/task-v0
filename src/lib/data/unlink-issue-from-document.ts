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

export async function unlinkIssueFromDocument(
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

	const [existing] = await db
		.select({ id: issueDocument.id })
		.from(issueDocument)
		.where(
			and(
				eq(issueDocument.issueId, linkedIssue.id),
				eq(issueDocument.documentId, doc.id),
			),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Link not found");
	}

	await db.delete(issueDocument).where(eq(issueDocument.id, existing.id));

	const issueLabel = `${issueCode(workspace.code, linkedIssue.number)} ${linkedIssue.title}`;
	await Promise.all([
		insertIssueHistory(linkedIssue.id, sessionUser.id, [
			{ field: "document", oldValue: doc.title, newValue: null },
		]),
		insertDocumentHistory(doc.id, sessionUser.id, [
			{ field: "issue", oldValue: issueLabel, newValue: null },
		]),
	]);

	return { issueId: linkedIssue.id };
}
