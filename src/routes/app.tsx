import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import PageNotFound from "#/components/PageNotFound";
import { getAuthSession } from "#/lib/auth.functions";

export const Route = createFileRoute("/app")({
	beforeLoad: async ({ location }) => {
		const session = await getAuthSession();

		if (!session) {
			throw redirect({
				to: "/sign-in",
				search: { redirect: location.pathname },
			});
		}

		return { session };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	notFoundComponent: () => <PageNotFound />,
	component: AppLayout,
});

function AppLayout() {
	return <Outlet />;
}
