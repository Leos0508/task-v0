import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue, issueComment } from "#/db/schema";
import { canManageMembers } from "#/lib/authz/roles";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function deleteComment(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
	commentId: string,
) {
	const { user, role, workspace } = await getWorkspaceAccess(
		sessionUser,
		workspaceCode,
	);

	const [existingIssue] = await db
		.select({ id: issue.id })
		.from(issue)
		.where(
			and(eq(issue.workspaceId, workspace.id), eq(issue.number, issueNumber)),
		)
		.limit(1);

	if (!existingIssue) {
		throw new AppError("NOT_FOUND", "Issue not found");
	}

	const [existing] = await db
		.select({
			id: issueComment.id,
			authorId: issueComment.authorId,
		})
		.from(issueComment)
		.where(
			and(
				eq(issueComment.id, commentId),
				eq(issueComment.issueId, existingIssue.id),
			),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Comment not found");
	}

	if (existing.authorId !== user.id && !canManageMembers(role)) {
		throw new AppError(
			"FORBIDDEN",
			"You do not have permission to delete this comment",
		);
	}

	await db.delete(issueComment).where(eq(issueComment.id, existing.id));

	return { id: existing.id };
}
