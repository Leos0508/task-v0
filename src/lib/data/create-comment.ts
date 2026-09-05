import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue, issueComment } from "#/db/schema";
import type { CreateCommentInput } from "#/features/issues/schema";
import { AppError } from "#/types/result";
import type { IssueComment } from "./fetch-issue-comments";
import { getWorkspaceAccess } from "./require-workspace-access";

export async function createComment(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
	input: CreateCommentInput,
): Promise<IssueComment> {
	const { user, workspace } = await getWorkspaceAccess(
		sessionUser,
		workspaceCode,
	);

	const [existing] = await db
		.select({ id: issue.id })
		.from(issue)
		.where(
			and(eq(issue.workspaceId, workspace.id), eq(issue.number, issueNumber)),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Issue not found");
	}

	const [row] = await db
		.insert(issueComment)
		.values({
			issueId: existing.id,
			authorId: user.id,
			body: input.body,
		})
		.returning({
			id: issueComment.id,
			body: issueComment.body,
			createdAt: issueComment.createdAt,
			updatedAt: issueComment.updatedAt,
		});

	if (!row) {
		throw new AppError("UNKNOWN", "Failed to add comment");
	}

	return {
		id: row.id,
		body: row.body,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		author: {
			id: user.id,
			name: user.name,
			image: user.image ?? null,
		},
	};
}
