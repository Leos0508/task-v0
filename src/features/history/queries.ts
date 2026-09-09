import { queryOptions } from "@tanstack/react-query";
import {
	listDocumentHistoryFn,
	listIssueHistoryFn,
} from "#/lib/functions/history.functions";

export const historyKeys = {
	issue: (workspaceCode: string, issueNumber: number) =>
		["workspaces", workspaceCode, "issues", issueNumber, "history"] as const,
	document: (workspaceCode: string, documentId: string) =>
		["workspaces", workspaceCode, "documents", documentId, "history"] as const,
};

export function issueHistoryQueryOptions(
	workspaceCode: string,
	issueNumber: number,
) {
	return queryOptions({
		queryKey: historyKeys.issue(workspaceCode, issueNumber),
		queryFn: () =>
			listIssueHistoryFn({
				data: { workspaceCode, issueNumber },
			}),
	});
}

export function documentHistoryQueryOptions(
	workspaceCode: string,
	documentId: string,
) {
	return queryOptions({
		queryKey: historyKeys.document(workspaceCode, documentId),
		queryFn: () =>
			listDocumentHistoryFn({
				data: { workspaceCode, documentId },
			}),
	});
}
