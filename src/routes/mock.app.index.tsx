import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "#/components/ui/separator";
import MockUserMenu from "#/mock/components/MockUserMenu";
import MockWorkspaceList from "#/mock/components/MockWorkspaceList";

export const Route = createFileRoute("/mock/app/")({
	component: MockWorkspacesPage,
});

function MockWorkspacesPage() {
	return (
		<div className="h-full min-h-0 w-full overflow-hidden">
			<div className="flex h-16 items-center justify-between gap-4 p-4">
				<h1 className="font-heading text-lg font-semibold uppercase">
					Workspaces
				</h1>
				<MockUserMenu />
			</div>
			<Separator />
			<div className="flex h-full w-full flex-col items-center justify-start overflow-y-auto px-8 py-16">
				<MockWorkspaceList />
			</div>
		</div>
	);
}
