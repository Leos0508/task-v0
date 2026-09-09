import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue, issueTag, tag } from "#/db/schema";
import { insertIssueHistory } from "#/lib/data/change-history";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function unlinkTagFromIssue(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
	tagId: string,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [[existingTag], [existingIssue]] = await Promise.all([
		db
			.select({ id: tag.id, name: tag.name })
			.from(tag)
			.where(and(eq(tag.id, tagId), eq(tag.workspaceId, workspace.id)))
			.limit(1),
		db
			.select({ id: issue.id })
			.from(issue)
			.where(
				and(eq(issue.workspaceId, workspace.id), eq(issue.number, issueNumber)),
			)
			.limit(1),
	]);

	if (!existingTag) {
		throw new AppError("NOT_FOUND", "Tag not found");
	}
	if (!existingIssue) {
		throw new AppError("NOT_FOUND", "Issue not found");
	}

	const [existing] = await db
		.select({ id: issueTag.id })
		.from(issueTag)
		.where(
			and(
				eq(issueTag.issueId, existingIssue.id),
				eq(issueTag.tagId, existingTag.id),
			),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Tag is not on this issue");
	}

	await db.delete(issueTag).where(eq(issueTag.id, existing.id));

	await insertIssueHistory(existingIssue.id, sessionUser.id, [
		{ field: "tag", oldValue: existingTag.name, newValue: null },
	]);

	return { tagId: existingTag.id };
}
