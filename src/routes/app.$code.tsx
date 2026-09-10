import {
	createFileRoute,
	notFound,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import AppSidebar from "#/components/AppSidebar";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import PageNotFound from "#/components/PageNotFound";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";
import { issueViewsQueryOptions } from "#/features/issues/queries";
import {
	workspaceAccessQueryOptions,
	workspacesQueryOptions,
} from "#/features/workspaces/queries";

export const Route = createFileRoute("/app/$code")({
	staleTime: 60_000,
	shouldReload: false,
	beforeLoad: async ({ context, params, location }) => {
		try {
			const access = await context.queryClient.ensureQueryData(
				workspaceAccessQueryOptions(params.code),
			);
			return { access };
		} catch (error) {
			if (error instanceof Error && error.message === "Unauthorized") {
				throw redirect({
					to: "/sign-in",
					search: { redirect: location.pathname },
				});
			}
			throw notFound();
		}
	},
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(workspacesQueryOptions),
			context.queryClient.ensureQueryData(
				issueViewsQueryOptions(context.access.workspace.code),
			),
		]);
		return { access: context.access };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	notFoundComponent: WorkspaceNotFound,
	component: WorkspaceLayout,
});

function WorkspaceNotFound() {
	const { code } = Route.useParams();

	return (
		<PageNotFound
			title="Workspace not found"
			description={`No workspace with code ${code} was found.`}
		/>
	);
}

function WorkspaceLayout() {
	const { access } = Route.useLoaderData();

	return (
		<SidebarProvider>
			<AppSidebar workspace={access.workspace} user={access.user} />
			<SidebarInset>
				<div className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
					<SidebarTrigger />
					<span className="font-heading text-lg font-semibold">Task</span>
				</div>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
