import { createFileRoute } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import UserMenu from "#/components/UserMenu";
import { Separator } from "#/components/ui/separator";
import WorkspaceList from "#/features/workspaces/components/WorkspaceList";
import {
	userQuotaQueryOptions,
	workspacesQueryOptions,
} from "#/features/workspaces/queries";

export const Route = createFileRoute("/app/")({
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(workspacesQueryOptions),
			context.queryClient.ensureQueryData(userQuotaQueryOptions),
		]);
		return { user: context.session.user };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: WorkspacesPage,
});

function WorkspacesPage() {
	const { user } = Route.useLoaderData();

	return (
		<div className="h-full min-h-0 w-full overflow-hidden">
			<div className="flex h-16 items-center justify-between gap-4 p-4">
				<h1 className="font-heading text-lg font-semibold uppercase">
					Workspaces
				</h1>
				<UserMenu user={user} />
			</div>
			<Separator />
			<div className="flex h-full w-full flex-col items-center justify-start overflow-y-auto px-8 py-16">
				<WorkspaceList />
			</div>
		</div>
	);
}
