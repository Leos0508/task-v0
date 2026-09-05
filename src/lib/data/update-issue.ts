import type { User } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue } from "#/db/schema";
import type { UpdateIssueInput } from "#/features/issues/schema";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { RANK_GAP } from "#/lib/issue-rank";
import { AppError } from "#/types/result";

export async function updateIssue(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
	input: UpdateIssueInput,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [existing] = await db
		.select({
			id: issue.id,
			number: issue.number,
			status: issue.status,
		})
		.from(issue)
		.where(
			and(eq(issue.workspaceId, workspace.id), eq(issue.number, issueNumber)),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Issue not found");
	}

	const patch: {
		title?: string;
		status?: UpdateIssueInput["status"];
		priority?: UpdateIssueInput["priority"];
		startDate?: string | null;
		endDate?: string | null;
		description?: unknown;
		rank?: number;
	} = {};

	if (input.title !== undefined) {
		patch.title = input.title.trim();
	}
	if (input.status !== undefined) {
		patch.status = input.status;
		if (input.status !== existing.status) {
			const [last] = await db
				.select({ rank: issue.rank })
				.from(issue)
				.where(
					and(
						eq(issue.workspaceId, workspace.id),
						eq(issue.status, input.status),
					),
				)
				.orderBy(desc(issue.rank))
				.limit(1);
			patch.rank = (last?.rank ?? 0) + RANK_GAP;
		}
	}
	if (input.priority !== undefined) {
		patch.priority = input.priority;
	}
	if (input.startDate !== undefined) {
		patch.startDate = input.startDate;
	}
	if (input.endDate !== undefined) {
		patch.endDate = input.endDate;
	}
	if (input.description !== undefined) {
		patch.description = JSON.parse(JSON.stringify(input.description));
	}

	await db.update(issue).set(patch).where(eq(issue.id, existing.id));

	return { number: existing.number };
}
