import { createFileRoute } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import { Separator } from "#/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import DeleteWorkspaceCard from "#/features/settings/components/DeleteWorkspaceCard";
import MembersPanel from "#/features/settings/components/MembersPanel";
import WorkspaceGeneralForm from "#/features/settings/components/WorkspaceGeneralForm";
import { canDeleteWorkspace, canManageMembers } from "#/lib/authz/roles";
import {
	listInvitesFn,
	listMembersFn,
} from "#/lib/functions/members.functions";

export const Route = createFileRoute("/workspaces/$code/settings")({
	loader: async ({ context, params }) => {
		const { access } = context;
		const members = await listMembersFn({ data: { code: params.code } });
		const invites = canManageMembers(access.role)
			? await listInvitesFn({ data: { code: params.code } })
			: [];

		return { access, members, invites };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: SettingsPage,
});

function SettingsPage() {
	const { access, members, invites } = Route.useLoaderData();
	const { workspace, role, user } = access;

	return (
		<div className="dashboard-page">
			<div className="p-4">
				<h1 className="font-heading text-xl font-semibold">Settings</h1>
				<p className="text-xs text-muted-foreground">
					Workspace details, members, and danger zone
				</p>
			</div>
			<Separator />
			<div className="flex-1 overflow-y-auto p-6">
				<Tabs defaultValue="general">
					<TabsList>
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="members">Members</TabsTrigger>
						{canDeleteWorkspace(role) ? (
							<TabsTrigger value="danger">Danger zone</TabsTrigger>
						) : null}
					</TabsList>
					<TabsContent value="general" className="pt-6">
						<WorkspaceGeneralForm
							workspace={{
								name: workspace.name,
								code: workspace.code,
								color: workspace.color,
							}}
							readOnly={role !== "OWNER"}
						/>
					</TabsContent>
					<TabsContent value="members" className="pt-6">
						<MembersPanel
							workspaceCode={workspace.code}
							actorRole={role}
							members={members}
							invites={invites}
							currentUserId={user.id}
							canManage={canManageMembers(role)}
						/>
					</TabsContent>
					{canDeleteWorkspace(role) ? (
						<TabsContent value="danger" className="pt-6">
							<DeleteWorkspaceCard
								workspaceCode={workspace.code}
								workspaceName={workspace.name}
							/>
						</TabsContent>
					) : null}
				</Tabs>
			</div>
		</div>
	);
}
