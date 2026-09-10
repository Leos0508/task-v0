import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { placementInputFromList } from "#/features/issues/board-drop";
import { issueKeys } from "#/features/issues/queries";
import type { ReorderIssueInput } from "#/features/issues/schema";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import { reorderIssueFn } from "#/lib/functions/issues.functions";
import {
	compareIssueRank,
	insertIndex,
	RANK_GAP,
	rankBetween,
} from "#/lib/issue-rank";

type PersistSession = {
	epoch: number;
	inflight: boolean;
	baseline: IssueListItem[] | undefined;
};

const persistSessions = new Map<string, PersistSession>();

function sessionKey(workspaceCode: string, issueId: string) {
	return `${workspaceCode}:${issueId}`;
}

export async function reorderIssueOnBoard(
	queryClient: QueryClient,
	workspaceCode: string,
	issue: IssueListItem,
	input: ReorderIssueInput,
) {
	const key = issueKeys.all(workspaceCode);
	const previous = queryClient.getQueryData<IssueListItem[]>(key);
	const column = (previous ?? [])
		.filter((row) => row.status === input.status)
		.sort(compareIssueRank);
	const currentIdx = column.findIndex((row) => row.id === issue.id);
	const others = column.filter((row) => row.id !== issue.id);

	let insertAt = others.length;
	if (input.targetIssueId) {
		const targetIdx = others.findIndex((row) => row.id === input.targetIssueId);
		if (targetIdx === -1) return;
		insertAt = insertIndex(targetIdx, input.edge, others.length);
	}

	if (currentIdx !== -1 && insertAt === currentIdx) return;

	const before = others[insertAt - 1]?.rank ?? null;
	const after = others[insertAt]?.rank ?? null;
	const nextRank = rankBetween(before, after) ?? (insertAt + 1) * RANK_GAP;

	const persistKey = sessionKey(workspaceCode, issue.id);
	let session = persistSessions.get(persistKey);
	if (!session?.inflight) {
		session = { epoch: 0, inflight: false, baseline: previous };
		persistSessions.set(persistKey, session);
	}
	session.epoch += 1;

	queryClient.setQueryData<IssueListItem[]>(key, (rows) =>
		rows?.map((row) =>
			row.id === issue.id
				? {
						...row,
						status: input.status,
						rank: nextRank,
					}
				: row,
		),
	);

	void persistBoardReorder(queryClient, workspaceCode, issue.id, issue.number);
}

async function persistBoardReorder(
	queryClient: QueryClient,
	workspaceCode: string,
	issueId: string,
	issueNumber: number,
) {
	const persistKey = sessionKey(workspaceCode, issueId);
	const session = persistSessions.get(persistKey);
	if (!session || session.inflight) return;

	session.inflight = true;
	const key = issueKeys.all(workspaceCode);

	try {
		while (true) {
			const epoch = session.epoch;
			const rows = queryClient.getQueryData<IssueListItem[]>(key);
			const input = rows ? placementInputFromList(rows, issueId) : null;
			if (!input) {
				persistSessions.delete(persistKey);
				return;
			}

			const result = await reorderIssueFn({
				data: {
					workspaceCode,
					issueNumber,
					input,
				},
			});

			if (session.epoch !== epoch) continue;

			if (!result.success) {
				queryClient.setQueryData(key, session.baseline);
				toast.error(result.error.message);
				persistSessions.delete(persistKey);
				return;
			}

			const placements = result.data?.placements ?? [];
			if (placements.length > 0) {
				queryClient.setQueryData<IssueListItem[]>(key, (current) => {
					if (!current) return current;
					const next = new Map(placements.map((row) => [row.id, row]));
					return current.map((row) => {
						const placement = next.get(row.id);
						return placement
							? { ...row, rank: placement.rank, status: placement.status }
							: row;
					});
				});
			}

			persistSessions.delete(persistKey);
			return;
		}
	} finally {
		const current = persistSessions.get(persistKey);
		if (current) current.inflight = false;
	}
}
