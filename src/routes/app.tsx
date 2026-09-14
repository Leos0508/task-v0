import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import EmailUnverifiedBanner from "#/components/EmailUnverifiedBanner";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import PageNotFound from "#/components/PageNotFound";
import { authSessionQueryOptions } from "#/features/auth/queries";

export const Route = createFileRoute("/app")({
	staleTime: 60_000,
	shouldReload: false,
	beforeLoad: async ({ context, location }) => {
		const session = await context.queryClient.ensureQueryData(
			authSessionQueryOptions,
		);

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
	const { session } = Route.useRouteContext();

	return (
		<div className="flex h-full min-h-0 flex-col">
			{session.user.emailVerified ? null : (
				<EmailUnverifiedBanner email={session.user.email} />
			)}
			<div className="min-h-0 flex-1">
				<Outlet />
			</div>
		</div>
	);
}
