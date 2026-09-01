import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { WorkspaceRole } from "#/db/schema";
import { canChangeMemberRole, canRemoveMember } from "#/lib/authz/roles";
import type { WorkspaceInviteItem } from "#/lib/data/fetch-workspace-invites";
import type { WorkspaceMember } from "#/lib/data/fetch-workspace-members";
import { createAppColumnHelper } from "#/lib/data-table";

const memberHelper = createAppColumnHelper<WorkspaceMember>();
const inviteHelper = createAppColumnHelper<WorkspaceInviteItem>();

const ROLE_OPTIONS = ["MEMBER", "ADMIN", "OWNER"] as const;

type MemberColumnOptions = {
	actorRole: WorkspaceRole;
	currentUserId: string;
	canManage: boolean;
	onRoleChange: (membershipId: string, role: WorkspaceRole) => void;
	onRemove: (membershipId: string) => void;
};

export function createMemberColumns({
	actorRole,
	currentUserId,
	canManage,
	onRoleChange,
	onRemove,
}: MemberColumnOptions) {
	return memberHelper.columns([
		memberHelper.accessor("name", { header: "Name" }),
		memberHelper.accessor("email", { header: "Email" }),
		memberHelper.accessor("role", {
			header: "Role",
			cell: ({ row }) => {
				const member = row.original;
				const isSelf = member.userId === currentUserId;
				const roleOptions = ROLE_OPTIONS.filter(
					(role) =>
						role === member.role ||
						canChangeMemberRole(actorRole, member.role, role),
				);
				const canEditRole =
					canManage &&
					!isSelf &&
					roleOptions.some((role) => role !== member.role);

				if (!canEditRole) {
					return <Badge variant="secondary">{member.role}</Badge>;
				}

				return (
					<Select
						value={member.role}
						onValueChange={(value) =>
							onRoleChange(member.id, value as WorkspaceRole)
						}
					>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{roleOptions.map((role) => (
								<SelectItem key={role} value={role}>
									{role}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);
			},
		}),
		memberHelper.display({
			id: "actions",
			cell: ({ row }) => {
				const member = row.original;
				const isSelf = member.userId === currentUserId;
				if (!canManage || isSelf || !canRemoveMember(actorRole, member.role)) {
					return null;
				}

				return (
					<Button variant="ghost" size="sm" onClick={() => onRemove(member.id)}>
						Remove
					</Button>
				);
			},
			meta: { className: "text-right" },
		}),
	]);
}

type InviteColumnOptions = {
	onCopyLink: (token: string) => void;
	onRevoke: (inviteId: string) => void;
};

export function createInviteColumns({
	onCopyLink,
	onRevoke,
}: InviteColumnOptions) {
	return inviteHelper.columns([
		inviteHelper.accessor("email", { header: "Email" }),
		inviteHelper.accessor("role", {
			header: "Role",
			cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
		}),
		inviteHelper.accessor("expiresAt", {
			header: "Expires",
			cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
		}),
		inviteHelper.display({
			id: "actions",
			cell: ({ row }) => (
				<div className="flex justify-end gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onCopyLink(row.original.token)}
					>
						Copy link
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onRevoke(row.original.id)}
					>
						Revoke
					</Button>
				</div>
			),
			meta: { className: "text-right" },
		}),
	]);
}
