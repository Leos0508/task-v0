import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { IssuePriority, IssueStatus } from "#/db/schema";
import { issueKeys } from "#/features/issues/queries";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import { updateIssueFn } from "#/lib/functions/issues.functions";
import { RANK_GAP } from "#/lib/issue-rank";

export type IssuePatch = {
	status?: IssueStatus;
	priority?: IssuePriority | null;
	startDate?: string | null;
	endDate?: string | null;
};

export async function patchIssue(
	queryClient: QueryClient,
	workspaceCode: string,
	issue: IssueListItem,
	patch: IssuePatch,
) {
	const key = issueKeys.all(workspaceCode);
	const previous = queryClient.getQueryData<IssueListItem[]>(key);
	const rank =
		patch.status != null && patch.status !== issue.status
			? (previous ?? [])
					.filter((row) => row.status === patch.status && row.id !== issue.id)
					.reduce((max, row) => Math.max(max, row.rank), 0) + RANK_GAP
			: undefined;

	queryClient.setQueryData<IssueListItem[]>(key, (rows) =>
		rows?.map((row) =>
			row.id === issue.id
				? {
						...row,
						...patch,
						...(rank != null ? { rank } : {}),
						updatedAt: new Date().toISOString(),
					}
				: row,
		),
	);

	const result = await updateIssueFn({
		data: {
			workspaceCode,
			issueNumber: issue.number,
			input: patch,
		},
	});
	if (!result.success) {
		queryClient.setQueryData(key, previous);
		toast.error(result.error.message);
		return;
	}

	await queryClient.invalidateQueries({ queryKey: key });
}
