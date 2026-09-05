import type { User } from "better-auth";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue } from "#/db/schema";
import type { ReorderIssueInput } from "#/features/issues/schema";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { insertIndex, RANK_GAP, rankBetween } from "#/lib/issue-rank";
import { AppError } from "#/types/result";

export async function reorderIssue(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
	input: ReorderIssueInput,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [moving] = await db
		.select({
			id: issue.id,
			number: issue.number,
		})
		.from(issue)
		.where(
			and(eq(issue.workspaceId, workspace.id), eq(issue.number, issueNumber)),
		)
		.limit(1);

	if (!moving) {
		throw new AppError("NOT_FOUND", "Issue not found");
	}

	const column = await db
		.select({
			id: issue.id,
			rank: issue.rank,
			number: issue.number,
		})
		.from(issue)
		.where(
			and(eq(issue.workspaceId, workspace.id), eq(issue.status, input.status)),
		)
		.orderBy(asc(issue.rank), desc(issue.number));

	const currentIdx = column.findIndex((row) => row.id === moving.id);
	const others = column.filter((row) => row.id !== moving.id);

	let insertAt = others.length;
	if (input.targetIssueId) {
		const targetIdx = others.findIndex((row) => row.id === input.targetIssueId);
		if (targetIdx === -1) {
			throw new AppError("VALIDATE", "Drop target is not in this column");
		}
		insertAt = insertIndex(targetIdx, input.edge, others.length);
	}

	if (currentIdx !== -1 && insertAt === currentIdx) {
		return { number: moving.number };
	}

	const before = others[insertAt - 1]?.rank ?? null;
	const after = others[insertAt]?.rank ?? null;
	const nextRank = rankBetween(before, after);

	if (nextRank != null) {
		await db
			.update(issue)
			.set({ rank: nextRank, status: input.status })
			.where(eq(issue.id, moving.id));
		return { number: moving.number };
	}

	const next = [...others];
	next.splice(insertAt, 0, {
		id: moving.id,
		rank: 0,
		number: moving.number,
	});

	for (let i = 0; i < next.length; i += 1) {
		await db
			.update(issue)
			.set({
				rank: (i + 1) * RANK_GAP,
				status: input.status,
			})
			.where(eq(issue.id, next[i].id));
	}

	return { number: moving.number };
}
