import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

	queryClient.setQueryData<IssueListItem[]>(key, (rows) =>
		rows?.map((row) =>
			row.id === issue.id
				? {
						...row,
						status: input.status,
						rank: nextRank,
						updatedAt: new Date().toISOString(),
					}
				: row,
		),
	);

	const result = await reorderIssueFn({
		data: {
			workspaceCode,
			issueNumber: issue.number,
			input,
		},
	});
	if (!result.success) {
		queryClient.setQueryData(key, previous);
		toast.error(result.error.message);
		return;
	}

	await queryClient.invalidateQueries({ queryKey: key });
}
