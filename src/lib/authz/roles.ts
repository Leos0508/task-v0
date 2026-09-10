import type { WorkspaceRole } from "#/db/schema";

const ROLE_RANK: Record<WorkspaceRole, number> = {
	MEMBER: 0,
	ADMIN: 1,
	OWNER: 2,
};

export function hasAtLeast(role: WorkspaceRole, minimum: WorkspaceRole) {
	return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canManageMembers(role: WorkspaceRole) {
	return hasAtLeast(role, "ADMIN");
}

export function canDeleteWorkspace(role: WorkspaceRole) {
	return role === "OWNER";
}

export function canManageIssueView(
	role: WorkspaceRole,
	createdById: string,
	userId: string,
) {
	return createdById === userId || hasAtLeast(role, "ADMIN");
}

export function canInviteRole(actor: WorkspaceRole, target: WorkspaceRole) {
	if (target === "OWNER") return false;
	if (actor === "OWNER") return target === "ADMIN" || target === "MEMBER";
	if (actor === "ADMIN") return target === "MEMBER";
	return false;
}

export function canChangeMemberRole(
	actor: WorkspaceRole,
	target: WorkspaceRole,
	next: WorkspaceRole,
) {
	if (target === "OWNER" && actor !== "OWNER") return false;
	if (next === "OWNER" && actor !== "OWNER") return false;
	if (actor === "ADMIN" && (target === "ADMIN" || next === "ADMIN")) {
		return false;
	}
	return canManageMembers(actor);
}

export function canRemoveMember(actor: WorkspaceRole, target: WorkspaceRole) {
	if (!canManageMembers(actor)) return false;
	if (target === "OWNER" && actor !== "OWNER") return false;
	if (target === "ADMIN" && actor === "ADMIN") return false;
	return true;
}
