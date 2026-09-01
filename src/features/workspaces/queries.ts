import { queryOptions } from "@tanstack/react-query";
import { listWorkspacesFn } from "#/lib/functions/workspaces.functions";

export const workspaceKeys = {
	all: ["workspaces"] as const,
};

export const workspacesQueryOptions = queryOptions({
	queryKey: workspaceKeys.all,
	queryFn: () => listWorkspacesFn(),
});
