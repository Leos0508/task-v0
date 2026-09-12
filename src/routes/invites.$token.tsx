import { createFileRoute, redirect } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import { authSessionQueryOptions } from "#/features/auth/queries";
import AcceptInviteCard from "#/features/settings/components/AcceptInviteCard";
import { userQuotaQueryOptions } from "#/features/workspaces/queries";
import { getInviteByTokenFn } from "#/lib/functions/members.functions";

export const Route = createFileRoute("/invites/$token")({
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
	},
	loader: async ({ context, params }) => {
		const [invite] = await Promise.all([
			getInviteByTokenFn({ data: { token: params.token } }),
			context.queryClient.ensureQueryData(userQuotaQueryOptions),
		]);
		return { invite, token: params.token };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: InvitePage,
});

function InvitePage() {
	const { invite, token } = Route.useLoaderData();

	if (!invite) {
		return (
			<div className="flex h-full w-full items-center justify-center p-6">
				<p className="text-sm text-muted-foreground">
					This invite is invalid or has expired.
				</p>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full items-center justify-center p-6">
			<AcceptInviteCard
				token={token}
				workspaceName={invite.workspaceName}
				memberCount={invite.memberCount}
				memberLimit={invite.memberLimit}
			/>
		</div>
	);
}
