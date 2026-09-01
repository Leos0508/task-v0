import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import { Button } from "#/components/ui/button";
import { workspaceKeys } from "#/features/workspaces/queries";
import { deleteWorkspaceFn } from "#/lib/functions/workspaces.functions";

export default function DeleteWorkspaceCard({
	workspaceCode,
	workspaceName,
}: {
	workspaceCode: string;
	workspaceName: string;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	async function handleDelete() {
		const result = await deleteWorkspaceFn({
			data: { workspaceCode },
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}
		await queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
		toast.success("Workspace deleted");
		navigate({ to: "/workspaces" });
	}

	return (
		<div className="rounded-lg border border-destructive/30 p-4 max-w-lg">
			<h3 className="font-medium text-destructive">Delete workspace</h3>
			<p className="text-sm text-muted-foreground mt-1 mb-4">
				Permanently delete {workspaceName} and all issues, members, and invites.
				Only an owner can do this.
			</p>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive">Delete workspace</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete {workspaceName}?</AlertDialogTitle>
						<AlertDialogDescription>
							This cannot be undone. Related issues, memberships, and invites
							will also be deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={handleDelete}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
