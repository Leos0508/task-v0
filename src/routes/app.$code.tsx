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
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";
import { workspacesQueryOptions } from "#/features/workspaces/queries";
import { getWorkspaceAccessFn } from "#/lib/functions/workspaces.functions";

export const Route = createFileRoute("/app/$code")({
	beforeLoad: async ({ params, location }) => {
		try {
			const access = await getWorkspaceAccessFn({
				data: { code: params.code },
			});
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
		await context.queryClient.ensureQueryData(workspacesQueryOptions);
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
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
