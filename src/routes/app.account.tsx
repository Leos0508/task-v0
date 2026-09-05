import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import UserMenu from "#/components/UserMenu";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import ApiKeysPanel from "#/features/account/components/ApiKeysPanel";

export const Route = createFileRoute("/app/account")({
	loader: async ({ context }) => {
		return { user: context.session.user };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: AccountPage,
});

function AccountPage() {
	const { user } = Route.useLoaderData();

	return (
		<div className="h-full min-h-0 w-full overflow-hidden">
			<div className="flex h-16 items-center justify-between gap-4 p-4">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/app">
							<ChevronLeft />
							Back
						</Link>
					</Button>
					<h1 className="font-heading text-lg font-semibold">Account</h1>
				</div>
				<UserMenu user={user} />
			</div>
			<Separator />
			<div className="h-full overflow-y-auto px-6 py-8">
				<div className="mb-6">
					<h2 className="font-heading text-xl font-semibold">API keys</h2>
					<p className="text-sm text-muted-foreground">
						Authenticate MCP clients to read workspaces and read or write issues
						and documents.
					</p>
				</div>
				<ApiKeysPanel />
			</div>
		</div>
	);
}
