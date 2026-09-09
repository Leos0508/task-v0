import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import type { WorkspaceInviteItem } from "#/lib/data/fetch-workspace-invites";
import type { WorkspaceMember } from "#/lib/data/fetch-workspace-members";
import { createAppColumnHelper, useAppTable } from "#/lib/data-table";
import { mockInvites, mockMembers, mockWorkspace } from "#/mock/fixtures";

const memberHelper = createAppColumnHelper<WorkspaceMember>();
const inviteHelper = createAppColumnHelper<WorkspaceInviteItem>();

const memberColumns = memberHelper.columns([
	memberHelper.accessor("name", { header: "Name" }),
	memberHelper.accessor("email", { header: "Email" }),
	memberHelper.accessor("role", {
		header: "Role",
		cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
	}),
]);

const inviteColumns = inviteHelper.columns([
	inviteHelper.accessor("email", { header: "Email" }),
	inviteHelper.accessor("role", {
		header: "Role",
		cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
	}),
	inviteHelper.display({
		id: "link",
		header: "Invite",
		cell: () => (
			<Button variant="link" size="sm" asChild>
				<Link to="/mock/invites/demo">Open demo invite</Link>
			</Button>
		),
	}),
]);

export const Route = createFileRoute("/mock/app/v0/settings")({
	component: MockSettingsPage,
});

function MockSettingsPage() {
	const navigate = useNavigate();
	const membersTable = useAppTable({
		columns: memberColumns,
		data: mockMembers,
		getRowId: (row) => row.id,
	});
	const invitesTable = useAppTable({
		columns: inviteColumns,
		data: mockInvites,
		getRowId: (row) => row.id,
	});

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
						<TabsTrigger value="danger">Danger zone</TabsTrigger>
					</TabsList>
					<TabsContent value="general" className="pt-6">
						<form
							className="max-w-lg"
							onSubmit={(event) => {
								event.preventDefault();
								toast.message("Mock only — workspace not updated");
							}}
						>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="set-name">Name</FieldLabel>
									<Input id="set-name" defaultValue={mockWorkspace.name} />
								</Field>
								<Field>
									<FieldLabel htmlFor="set-code">Code</FieldLabel>
									<Input
										id="set-code"
										defaultValue={mockWorkspace.code}
										className="font-mono uppercase"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="set-color">Color</FieldLabel>
									<div className="flex items-center gap-2">
										<input
											id="set-color"
											type="color"
											defaultValue={mockWorkspace.color}
											className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
										/>
										<Input
											defaultValue={mockWorkspace.color}
											className="font-mono uppercase"
										/>
										<Button type="button" variant="outline" size="icon">
											<RefreshCwIcon />
										</Button>
									</div>
								</Field>
							</FieldGroup>
							<Button className="mt-4" type="submit">
								Save
							</Button>
						</form>
					</TabsContent>
					<TabsContent value="members" className="pt-6">
						<form
							className="mb-6 flex max-w-lg flex-col gap-3"
							onSubmit={(event) => {
								event.preventDefault();
								toast.message("Mock only — invite not created");
							}}
						>
							<Field>
								<FieldLabel htmlFor="invite-email">Invite email</FieldLabel>
								<Input
									id="invite-email"
									type="email"
									placeholder="guest@example.com"
								/>
							</Field>
							<Button type="submit" className="self-start">
								Send invite
							</Button>
						</form>
						<p className="mb-2 text-sm font-medium">Members</p>
						<DataTable table={membersTable} emptyMessage="No members." />
						<p className="mt-6 mb-2 text-sm font-medium">Pending invites</p>
						<DataTable table={invitesTable} emptyMessage="No invites." />
					</TabsContent>
					<TabsContent value="danger" className="pt-6">
						<div className="max-w-lg rounded-lg border border-destructive/30 p-4">
							<h3 className="font-medium text-destructive">Delete workspace</h3>
							<p className="mt-1 mb-4 text-sm text-muted-foreground">
								Permanently delete {mockWorkspace.name} and all issues, members,
								and invites. Only an owner can do this.
							</p>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="destructive">Delete workspace</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Delete {mockWorkspace.name}?
										</AlertDialogTitle>
										<AlertDialogDescription>
											This cannot be undone. Related issues, memberships, and
											invites will also be deleted.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											variant="destructive"
											onClick={() => {
												toast.message("Mock only — workspace not deleted");
												navigate({ to: "/mock/app" });
											}}
										>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
