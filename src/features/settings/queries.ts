import { queryOptions } from "@tanstack/react-query";
import {
	listInvitesFn,
	listMembersFn,
} from "#/lib/functions/members.functions";
import { getWorkspaceQuotaFn } from "#/lib/functions/quota.functions";

export const memberKeys = {
	all: (workspaceCode: string) =>
		["workspaces", workspaceCode, "members"] as const,
};

export const quotaKeys = {
	workspace: (workspaceCode: string) =>
		["workspaces", workspaceCode, "quota"] as const,
};

export const inviteKeys = {
	all: (workspaceCode: string) =>
		["workspaces", workspaceCode, "invites"] as const,
};

export function membersQueryOptions(workspaceCode: string) {
	return queryOptions({
		queryKey: memberKeys.all(workspaceCode),
		queryFn: () => listMembersFn({ data: { code: workspaceCode } }),
	});
}

export function invitesQueryOptions(workspaceCode: string) {
	return queryOptions({
		queryKey: inviteKeys.all(workspaceCode),
		queryFn: () => listInvitesFn({ data: { code: workspaceCode } }),
	});
}

export function workspaceQuotaQueryOptions(workspaceCode: string) {
	return queryOptions({
		queryKey: quotaKeys.workspace(workspaceCode),
		queryFn: () => getWorkspaceQuotaFn({ data: { code: workspaceCode } }),
	});
}
