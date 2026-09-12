import { count, eq, sum } from "drizzle-orm";
import { db } from "#/db";
import { workspaceFile, workspaceUser } from "#/db/schema";
import { getQuotaExemptUserIds } from "#/lib/env.server";
import {
	MAX_MEMBERS_PER_WORKSPACE,
	MAX_WORKSPACE_STORAGE_BYTES,
	MAX_WORKSPACES_PER_USER,
	MEMBER_LIMIT_MESSAGE,
	STORAGE_LIMIT_MESSAGE,
	type UserQuota,
	WORKSPACE_LIMIT_MESSAGE,
	type WorkspaceQuota,
} from "#/lib/quota";
import { AppError } from "#/types/result";

export function isQuotaExempt(userId: string) {
	return getQuotaExemptUserIds().includes(userId);
}

export async function countUserMemberships(userId: string) {
	const [row] = await db
		.select({ value: count() })
		.from(workspaceUser)
		.where(eq(workspaceUser.userId, userId));

	return row?.value ?? 0;
}

export async function countWorkspaceMembers(workspaceId: string) {
	const [row] = await db
		.select({ value: count() })
		.from(workspaceUser)
		.where(eq(workspaceUser.workspaceId, workspaceId));

	return row?.value ?? 0;
}

export async function sumWorkspaceStorageBytes(workspaceId: string) {
	const [row] = await db
		.select({ value: sum(workspaceFile.size) })
		.from(workspaceFile)
		.where(eq(workspaceFile.workspaceId, workspaceId));

	return Number(row?.value ?? 0);
}

export async function getUserQuota(userId: string): Promise<UserQuota> {
	return {
		exempt: isQuotaExempt(userId),
		workspaceCount: await countUserMemberships(userId),
		workspaceLimit: MAX_WORKSPACES_PER_USER,
	};
}

export async function getWorkspaceQuota(
	workspaceId: string,
	userId: string,
): Promise<WorkspaceQuota> {
	const [memberCount, storageBytes] = await Promise.all([
		countWorkspaceMembers(workspaceId),
		sumWorkspaceStorageBytes(workspaceId),
	]);

	return {
		exempt: isQuotaExempt(userId),
		memberCount,
		memberLimit: MAX_MEMBERS_PER_WORKSPACE,
		storageBytes,
		storageLimit: MAX_WORKSPACE_STORAGE_BYTES,
	};
}

export async function assertCanJoinWorkspace(userId: string) {
	if (isQuotaExempt(userId)) return;

	const memberships = await countUserMemberships(userId);
	if (memberships >= MAX_WORKSPACES_PER_USER) {
		throw new AppError("VALIDATE", WORKSPACE_LIMIT_MESSAGE);
	}
}

export async function assertCanAddWorkspaceMember(
	workspaceId: string,
	actorUserId: string,
) {
	if (isQuotaExempt(actorUserId)) return;

	const members = await countWorkspaceMembers(workspaceId);
	if (members >= MAX_MEMBERS_PER_WORKSPACE) {
		throw new AppError("VALIDATE", MEMBER_LIMIT_MESSAGE);
	}
}

export async function assertCanUploadBytes(
	workspaceId: string,
	userId: string,
	bytes: number,
) {
	if (isQuotaExempt(userId)) return;

	const used = await sumWorkspaceStorageBytes(workspaceId);
	if (used + bytes > MAX_WORKSPACE_STORAGE_BYTES) {
		throw new AppError("VALIDATE", STORAGE_LIMIT_MESSAGE);
	}
}
