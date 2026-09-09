import type { User } from "better-auth";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import type { IssuePriority, IssueStatus } from "#/db/schema";
import { issue } from "#/db/schema";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { RANK_GAP } from "#/lib/issue-rank";
import { AppError, isUniqueConstraintError } from "#/types/result";

export type CreateIssueInput = {
	title?: string;
	status?: IssueStatus;
	priority?: IssuePriority | null;
	startDate?: string | null;
	endDate?: string | null;
	description?: unknown;
};

export async function createIssue(
	sessionUser: User,
	workspaceCode: string,
	input?: CreateIssueInput,
) {
	if (input?.startDate && input.endDate && input.startDate > input.endDate) {
		throw new AppError("VALIDATE", "End must be on or after start");
	}

	const { user, workspace } = await getWorkspaceAccess(
		sessionUser,
		workspaceCode,
	);

	let created: { number: number } | undefined;

	for (let attempt = 0; attempt < 3; attempt += 1) {
		try {
			const [latest] = await db
				.select({ number: issue.number })
				.from(issue)
				.where(eq(issue.workspaceId, workspace.id))
				.orderBy(desc(issue.number))
				.limit(1);

			const number = (latest?.number ?? 0) + 1;
			const title = input?.title?.trim() || `New Issue #${number}`;
			const status = input?.status ?? "TODO";

			const [first] = await db
				.select({ rank: issue.rank })
				.from(issue)
				.where(
					and(eq(issue.workspaceId, workspace.id), eq(issue.status, status)),
				)
				.orderBy(asc(issue.rank))
				.limit(1);

			const [row] = await db
				.insert(issue)
				.values({
					workspaceId: workspace.id,
					reporterId: user.id,
					number,
					title,
					status,
					rank: (first?.rank ?? RANK_GAP) - RANK_GAP,
					priority: input?.priority ?? null,
					startDate: input?.startDate ? new Date(input.startDate) : null,
					endDate: input?.endDate ? new Date(input.endDate) : null,
					description:
						input?.description === undefined
							? undefined
							: JSON.parse(JSON.stringify(input.description)),
				})
				.returning({ number: issue.number });

			created = row;
			break;
		} catch (error) {
			if (!isUniqueConstraintError(error) || attempt === 2) {
				throw error;
			}
		}
	}

	if (!created) {
		throw new AppError("UNKNOWN", "Failed to create issue");
	}

	return created;
}
