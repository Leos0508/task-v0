import { queryOptions } from "@tanstack/react-query";
import { listIssuesFn } from "#/lib/functions/issues.functions";

export const issueKeys = {
	all: (workspaceCode: string) =>
		["workspaces", workspaceCode, "issues"] as const,
};

export function issuesQueryOptions(workspaceCode: string) {
	return queryOptions({
		queryKey: issueKeys.all(workspaceCode),
		queryFn: () => listIssuesFn({ data: { code: workspaceCode } }),
	});
}
