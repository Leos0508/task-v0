import { useForm, useSelector } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { WorkspaceRole } from "#/db/schema";
import {
	createInviteColumns,
	createMemberColumns,
} from "#/features/settings/components/member-columns";
import { canInviteRole } from "#/lib/authz/roles";
import type { WorkspaceInviteItem } from "#/lib/data/fetch-workspace-invites";
import type { WorkspaceMember } from "#/lib/data/fetch-workspace-members";
import { useAppTable } from "#/lib/data-table";
import {
	inviteMemberFn,
	removeMemberFn,
	revokeInviteFn,
	updateMemberRoleFn,
} from "#/lib/functions/members.functions";
import { inviteKeys, memberKeys } from "../queries";
import { type InviteMemberInput, inviteMemberSchema } from "../schema";

function getMemberRowId(row: { id: string }) {
	return row.id;
}

type MembersPanelProps = {
	workspaceCode: string;
	actorRole: WorkspaceRole;
	members: WorkspaceMember[];
	invites: WorkspaceInviteItem[];
	currentUserId: string;
	canManage: boolean;
};

export default function MembersPanel({
	workspaceCode,
	actorRole,
	members,
	invites,
	currentUserId,
	canManage,
}: MembersPanelProps) {
	const queryClient = useQueryClient();

	const invalidateMembers = useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: memberKeys.all(workspaceCode),
			}),
			queryClient.invalidateQueries({
				queryKey: inviteKeys.all(workspaceCode),
			}),
		]);
	}, [queryClient, workspaceCode]);

	const form = useForm({
		defaultValues: {
			email: "",
			role: "MEMBER",
		} as InviteMemberInput,
		validators: { onSubmit: inviteMemberSchema },
		onSubmit: async ({ value }) => {
			const result = await inviteMemberFn({
				data: { workspaceCode, input: value },
			});
			if (!result.success) {
				toast.error(result.error.message);
				return;
			}
			const url = `${window.location.origin}/invites/${result.data?.token}`;
			await navigator.clipboard.writeText(url).catch(() => undefined);
			toast.success("Invite created. Link copied to clipboard.");
			form.reset();
			await invalidateMembers();
		},
	});
	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

	const handleRoleChange = useCallback(
		async (membershipId: string, role: WorkspaceRole) => {
			const result = await updateMemberRoleFn({
				data: { workspaceCode, input: { membershipId, role } },
			});
			if (!result.success) {
				toast.error(result.error.message);
				return;
			}
			toast.success("Role updated");
			await invalidateMembers();
		},
		[invalidateMembers, workspaceCode],
	);

	const handleRemove = useCallback(
		async (membershipId: string) => {
			const result = await removeMemberFn({
				data: { workspaceCode, membershipId },
			});
			if (!result.success) {
				toast.error(result.error.message);
				return;
			}
			toast.success("Member removed");
			await invalidateMembers();
		},
		[invalidateMembers, workspaceCode],
	);

	const handleRevoke = useCallback(
		async (inviteId: string) => {
			const result = await revokeInviteFn({
				data: { workspaceCode, inviteId },
			});
			if (!result.success) {
				toast.error(result.error.message);
				return;
			}
			toast.success("Invite revoked");
			await invalidateMembers();
		},
		[invalidateMembers, workspaceCode],
	);

	const copyInviteLink = useCallback(async (token: string) => {
		const url = `${window.location.origin}/invites/${token}`;
		await navigator.clipboard.writeText(url).catch(() => undefined);
		toast.success("Invite link copied");
	}, []);

	const memberColumns = useMemo(
		() =>
			createMemberColumns({
				actorRole,
				currentUserId,
				canManage,
				onRoleChange: handleRoleChange,
				onRemove: handleRemove,
			}),
		[actorRole, canManage, currentUserId, handleRemove, handleRoleChange],
	);

	const inviteColumns = useMemo(
		() =>
			createInviteColumns({
				onCopyLink: copyInviteLink,
				onRevoke: handleRevoke,
			}),
		[copyInviteLink, handleRevoke],
	);

	const membersTable = useAppTable({
		columns: memberColumns,
		data: members,
		getRowId: getMemberRowId,
	});

	const invitesTable = useAppTable({
		columns: inviteColumns,
		data: invites,
		getRowId: getMemberRowId,
	});

	return (
		<div className="flex flex-col gap-8">
			{canManage && (
				<form
					className="max-w-xl"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<h3 className="font-medium mb-3">Invite a member</h3>
					<FieldGroup className="flex-row items-end max-sm:flex-col">
						<form.Field name="email">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid} className="flex-1">
										<FieldLabel htmlFor={field.name}>Email</FieldLabel>
										<Input
											id={field.name}
											type="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="teammate@email.com"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="role">
							{(field) => (
								<Field className="w-40">
									<FieldLabel>Role</FieldLabel>
									<Select
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(value as "MEMBER" | "ADMIN")
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{canInviteRole(actorRole, "MEMBER") && (
												<SelectItem value="MEMBER">Member</SelectItem>
											)}
											{canInviteRole(actorRole, "ADMIN") && (
												<SelectItem value="ADMIN">Admin</SelectItem>
											)}
										</SelectContent>
									</Select>
								</Field>
							)}
						</form.Field>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : (
								"Invite"
							)}
						</Button>
					</FieldGroup>
				</form>
			)}

			<div>
				<h3 className="font-medium mb-3">Members</h3>
				<DataTable table={membersTable} emptyMessage="No members yet." />
			</div>

			{canManage && (
				<div>
					<h3 className="font-medium mb-3">Pending invites</h3>
					<DataTable table={invitesTable} emptyMessage="No pending invites." />
				</div>
			)}
		</div>
	);
}
