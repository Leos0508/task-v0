import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue, issueComment, user as userTable } from "#/db/schema";
import type { UpdateCommentInput } from "#/features/issues/schema";
import { AppError } from "#/types/result";
import type { IssueComment } from "./fetch-issue-comments";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function updateComment(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
	commentId: string,
	input: UpdateCommentInput,
): Promise<IssueComment> {
	const { user, workspace } = await getWorkspaceAccess(
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

	if (existing.authorId !== user.id) {
		throw new AppError("FORBIDDEN", "You can only edit your own comments");
	}

	const [row] = await db
		.update(issueComment)
		.set({ body: input.body })
		.where(eq(issueComment.id, existing.id))
		.returning({
			id: issueComment.id,
			body: issueComment.body,
			createdAt: issueComment.createdAt,
			updatedAt: issueComment.updatedAt,
			authorId: issueComment.authorId,
		});

	if (!row) {
		throw new AppError("UNKNOWN", "Failed to update comment");
	}

	const [author] = await db
		.select({
			id: userTable.id,
			name: userTable.name,
			image: userTable.image,
		})
		.from(userTable)
		.where(eq(userTable.id, row.authorId))
		.limit(1);

	return {
		id: row.id,
		body: row.body,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		author: {
			id: author?.id ?? user.id,
			name: author?.name ?? user.name,
			image: author?.image ?? user.image ?? null,
		},
	};
}
