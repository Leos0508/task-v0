import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import { Button } from "#/components/ui/button";
import CreateWorkspaceForm from "#/features/workspaces/components/CreateWorkspaceForm";

export const Route = createFileRoute("/app/create-workspace")({
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: CreateWorkspacePage,
});

function CreateWorkspacePage() {
	return (
		<div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4">
			<Button variant="ghost" className="w-fit" asChild>
				<Link to="/app">
					<ChevronLeft />
					Back
				</Link>
			</Button>
			<div className="flex flex-1 items-center justify-center">
				<CreateWorkspaceForm />
			</div>
		</div>
	);
}
