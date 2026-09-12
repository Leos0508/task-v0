export const MAX_WORKSPACES_PER_USER = 5;
export const MAX_MEMBERS_PER_WORKSPACE = 20;
export const MAX_WORKSPACE_STORAGE_BYTES = 2 * 1024 * 1024 * 1024;

export const WORKSPACE_LIMIT_MESSAGE = "You can belong to at most 5 workspaces";
export const MEMBER_LIMIT_MESSAGE = "This workspace is limited to 20 members";
export const STORAGE_LIMIT_MESSAGE =
	"This image would exceed the 2 GB workspace upload limit";

export type UserQuota = {
	exempt: boolean;
	workspaceCount: number;
	workspaceLimit: number;
};

export type WorkspaceQuota = {
	exempt: boolean;
	memberCount: number;
	memberLimit: number;
	storageBytes: number;
	storageLimit: number;
};

export function canJoinMoreWorkspaces(quota: UserQuota) {
	return quota.exempt || quota.workspaceCount < quota.workspaceLimit;
}

export function canAddWorkspaceMember(quota: WorkspaceQuota) {
	return quota.exempt || quota.memberCount < quota.memberLimit;
}

export function formatStorageBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
