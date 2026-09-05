import { queryOptions } from "@tanstack/react-query";
import { listIssueCommentsFn } from "#/lib/functions/comments.functions";
import { listIssuesFn } from "#/lib/functions/issues.functions";
import { listTagsFn } from "#/lib/functions/tags.functions";

export const issueKeys = {
	all: (workspaceCode: string) =>
		["workspaces", workspaceCode, "issues"] as const,
};

export const tagKeys = {
	all: (workspaceCode: string) =>
		["workspaces", workspaceCode, "tags"] as const,
};

export const commentKeys = {
	byIssue: (workspaceCode: string, issueNumber: number) =>
		["workspaces", workspaceCode, "issues", issueNumber, "comments"] as const,
};

export function issuesQueryOptions(workspaceCode: string) {
	return queryOptions({
		queryKey: issueKeys.all(workspaceCode),
		queryFn: () => listIssuesFn({ data: { code: workspaceCode } }),
	});
}

export function tagsQueryOptions(workspaceCode: string) {
	return queryOptions({
		queryKey: tagKeys.all(workspaceCode),
		queryFn: () => listTagsFn({ data: { code: workspaceCode } }),
	});
}

export function issueCommentsQueryOptions(
	workspaceCode: string,
	issueNumber: number,
) {
	return queryOptions({
		queryKey: commentKeys.byIssue(workspaceCode, issueNumber),
		queryFn: () =>
			listIssueCommentsFn({
				data: { workspaceCode, issueNumber },
			}),
	});
}
