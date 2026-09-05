import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue, issueTag, tag } from "#/db/schema";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function linkTagToIssue(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
	tagId: string,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [[existingTag], [existingIssue]] = await Promise.all([
		db
			.select({
				id: tag.id,
				name: tag.name,
				color: tag.color,
			})
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

	await db.insert(issueTag).values({
		tagId: existingTag.id,
		issueId: existingIssue.id,
	});

	return existingTag;
}
