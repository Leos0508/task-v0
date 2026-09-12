import { queryOptions } from "@tanstack/react-query";
import { getUserQuotaFn } from "#/lib/functions/quota.functions";
import {
	getWorkspaceAccessFn,
	listWorkspacesFn,
} from "#/lib/functions/workspaces.functions";

export const workspaceKeys = {
	all: ["workspaces"] as const,
	quota: ["workspaces", "quota"] as const,
	access: (code: string) => ["workspaces", code, "access"] as const,
};

export const workspacesQueryOptions = queryOptions({
	queryKey: workspaceKeys.all,
	queryFn: () => listWorkspacesFn(),
});

export const userQuotaQueryOptions = queryOptions({
	queryKey: workspaceKeys.quota,
	queryFn: () => getUserQuotaFn(),
});

export function workspaceAccessQueryOptions(code: string) {
	return queryOptions({
		queryKey: workspaceKeys.access(code),
		queryFn: () => getWorkspaceAccessFn({ data: { code } }),
		staleTime: 60_000,
		retry: false,
	});
}
