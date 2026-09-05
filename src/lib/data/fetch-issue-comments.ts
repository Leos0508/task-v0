import type { User } from "better-auth";
import { and, asc, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue, issueComment, user as userTable } from "#/db/schema";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

export type IssueComment = {
	id: string;
	body: string;
	createdAt: string;
	updatedAt: string;
	author: {
		id: string;
		name: string;
		image: string | null;
	};
};

export async function fetchIssueComments(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
): Promise<IssueComment[]> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

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

	const rows = await db
		.select({
			id: issueComment.id,
			body: issueComment.body,
			createdAt: issueComment.createdAt,
			updatedAt: issueComment.updatedAt,
			authorId: userTable.id,
			authorName: userTable.name,
			authorImage: userTable.image,
		})
		.from(issueComment)
		.innerJoin(userTable, eq(issueComment.authorId, userTable.id))
		.where(eq(issueComment.issueId, existing.id))
		.orderBy(asc(issueComment.createdAt));

	return rows.map((row) => ({
		id: row.id,
		body: row.body,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		author: {
			id: row.authorId,
			name: row.authorName,
			image: row.authorImage,
		},
	}));
}
