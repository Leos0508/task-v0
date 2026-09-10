import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import {
	issuesQueryOptions,
	issueViewsQueryOptions,
	tagsQueryOptions,
} from "#/features/issues/queries";

export async function ensureIssueListData(
	queryClient: QueryClient,
	workspaceCode: string,
	viewId?: string,
	redirectFrom?: "/app/$code/" | "/app/$code/issues/",
) {
	const [views] = await Promise.all([
		queryClient.ensureQueryData(issueViewsQueryOptions(workspaceCode)),
		queryClient.ensureQueryData(issuesQueryOptions(workspaceCode)),
		queryClient.ensureQueryData(tagsQueryOptions(workspaceCode)),
	]);

	if (viewId && redirectFrom && !views.some((view) => view.id === viewId)) {
		throw redirect({
			from: redirectFrom,
			search: (prev) => ({ ...prev, viewId: undefined }),
		});
	}

	return views;
}
