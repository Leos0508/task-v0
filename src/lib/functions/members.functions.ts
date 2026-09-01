import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import {
	user as userTable,
	type WorkspaceRole,
	workspace,
	workspaceInvite,
	workspaceUser,
} from "#/db/schema";
import {
	inviteMemberSchema,
	updateMemberRoleSchema,
} from "#/features/settings/schema";
import {
	canChangeMemberRole,
	canInviteRole,
	canRemoveMember,
} from "#/lib/authz/roles";
import { fetchInviteByToken } from "#/lib/data/fetch-invite";
import { fetchWorkspaceInvites } from "#/lib/data/fetch-workspace-invites";
import { fetchWorkspaceMembers } from "#/lib/data/fetch-workspace-members";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { mapActionError } from "#/lib/map-action-error";
import { authMiddleware } from "#/middlewares/auth-middleware";
import { AppError } from "#/types/result";

const INVITE_DAYS = 7;

function inviteExpiry() {
	return new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
}

async function ensureRemainingOwner(workspaceId: string, role: WorkspaceRole) {
	if (role !== "OWNER") return;

	const [row] = await db
		.select({ value: count() })
		.from(workspaceUser)
		.where(
			and(
				eq(workspaceUser.workspaceId, workspaceId),
				eq(workspaceUser.role, "OWNER"),
			),
		);

	if ((row?.value ?? 0) <= 1) {
		throw new AppError(
			"VALIDATE",
			"The workspace must keep at least one owner",
		);
	}
}

export const listMembersFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ code: z.string() }))
	.handler(async ({ data, context }) =>
		fetchWorkspaceMembers(context.user, data.code),
	);

export const listInvitesFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ code: z.string() }))
	.handler(async ({ data, context }) =>
		fetchWorkspaceInvites(context.user, data.code),
	);

export const getInviteByTokenFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ token: z.string() }))
	.handler(async ({ data }) => fetchInviteByToken(data.token));

export const inviteMemberFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			input: inviteMemberSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const {
				user,
				role,
				workspace: current,
			} = await getWorkspaceAccess(context.user, data.workspaceCode, "ADMIN");

			if (!canInviteRole(role, data.input.role)) {
				throw new AppError(
					"FORBIDDEN",
					"You cannot invite someone with that role",
				);
			}

			const email = data.input.email.trim().toLowerCase();

			const [existingMember] = await db
				.select({ id: workspaceUser.id })
				.from(workspaceUser)
				.innerJoin(userTable, eq(workspaceUser.userId, userTable.id))
				.where(
					and(
						eq(workspaceUser.workspaceId, current.id),
						eq(userTable.email, email),
					),
				)
				.limit(1);

			if (existingMember) {
				return {
					success: false as const,
					error: {
						code: "VALIDATE" as const,
						message: "That user is already a member of this workspace",
					},
				};
			}

			const token = randomBytes(24).toString("hex");
			const [invite] = await db
				.insert(workspaceInvite)
				.values({
					workspaceId: current.id,
					email,
					role: data.input.role,
					token,
					expiresAt: inviteExpiry(),
					invitedById: user.id,
				})
				.onConflictDoUpdate({
					target: [workspaceInvite.workspaceId, workspaceInvite.email],
					set: {
						role: data.input.role,
						token,
						expiresAt: inviteExpiry(),
						invitedById: user.id,
					},
				})
				.returning({ id: workspaceInvite.id, token: workspaceInvite.token });

			return { success: true as const, data: invite };
		} catch (error) {
			return mapActionError(error, "Failed to send invite");
		}
	});

export const revokeInviteFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			inviteId: z.string(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const { workspace: current } = await getWorkspaceAccess(
				context.user,
				data.workspaceCode,
				"ADMIN",
			);

			await db
				.delete(workspaceInvite)
				.where(
					and(
						eq(workspaceInvite.id, data.inviteId),
						eq(workspaceInvite.workspaceId, current.id),
					),
				);

			return { success: true as const, data: { id: data.inviteId } };
		} catch (error) {
			return mapActionError(error, "Failed to revoke invite");
		}
	});

export const updateMemberRoleFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			input: updateMemberRoleSchema,
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const {
				user,
				role,
				workspace: current,
			} = await getWorkspaceAccess(context.user, data.workspaceCode, "ADMIN");

			const [member] = await db
				.select()
				.from(workspaceUser)
				.where(
					and(
						eq(workspaceUser.id, data.input.membershipId),
						eq(workspaceUser.workspaceId, current.id),
					),
				)
				.limit(1);

			if (!member) {
				throw new AppError("NOT_FOUND", "Member not found");
			}

			if (member.userId === user.id) {
				return {
					success: false as const,
					error: {
						code: "VALIDATE" as const,
						message: "You cannot change your own role",
					},
				};
			}

			if (!canChangeMemberRole(role, member.role, data.input.role)) {
				throw new AppError("FORBIDDEN", "You cannot assign that role");
			}

			await ensureRemainingOwner(current.id, member.role);

			await db
				.update(workspaceUser)
				.set({ role: data.input.role })
				.where(eq(workspaceUser.id, member.id));

			return { success: true as const, data: { id: member.id } };
		} catch (error) {
			return mapActionError(error, "Failed to update member role");
		}
	});

export const removeMemberFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			membershipId: z.string(),
		}),
	)
	.handler(async ({ data, context }) => {
		try {
			const {
				user,
				role,
				workspace: current,
			} = await getWorkspaceAccess(context.user, data.workspaceCode, "ADMIN");

			const [member] = await db
				.select()
				.from(workspaceUser)
				.where(
					and(
						eq(workspaceUser.id, data.membershipId),
						eq(workspaceUser.workspaceId, current.id),
					),
				)
				.limit(1);

			if (!member) {
				throw new AppError("NOT_FOUND", "Member not found");
			}

			if (member.userId === user.id) {
				return {
					success: false as const,
					error: {
						code: "VALIDATE" as const,
						message: "You cannot remove yourself",
					},
				};
			}

			if (!canRemoveMember(role, member.role)) {
				throw new AppError("FORBIDDEN", "You cannot remove that member");
			}

			await ensureRemainingOwner(current.id, member.role);

			await db.delete(workspaceUser).where(eq(workspaceUser.id, member.id));

			return { success: true as const, data: { id: data.membershipId } };
		} catch (error) {
			return mapActionError(error, "Failed to remove member");
		}
	});

export const acceptInviteFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(z.object({ token: z.string() }))
	.handler(async ({ data, context }) => {
		try {
			const user = context.user;

			const [invite] = await db
				.select({
					id: workspaceInvite.id,
					email: workspaceInvite.email,
					role: workspaceInvite.role,
					expiresAt: workspaceInvite.expiresAt,
					workspaceId: workspaceInvite.workspaceId,
					code: workspace.code,
				})
				.from(workspaceInvite)
				.innerJoin(workspace, eq(workspaceInvite.workspaceId, workspace.id))
				.where(eq(workspaceInvite.token, data.token))
				.limit(1);

			if (!invite || invite.expiresAt < new Date()) {
				return {
					success: false as const,
					error: {
						code: "NOT_FOUND" as const,
						message: "This invite is invalid or expired",
					},
				};
			}

			if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
				return {
					success: false as const,
					error: {
						code: "FORBIDDEN" as const,
						message: `Sign in as ${invite.email} to accept this invite`,
					},
				};
			}

			await db
				.insert(workspaceUser)
				.values({
					userId: user.id,
					workspaceId: invite.workspaceId,
					role: invite.role,
				})
				.onConflictDoUpdate({
					target: [workspaceUser.userId, workspaceUser.workspaceId],
					set: { role: invite.role },
				});

			await db.delete(workspaceInvite).where(eq(workspaceInvite.id, invite.id));

			return { success: true as const, data: { code: invite.code } };
		} catch (error) {
			return mapActionError(error, "Failed to accept invite");
		}
	});
