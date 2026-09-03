import { createFileRoute } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import { Separator } from "#/components/ui/separator";
import IssueList from "#/features/issues/components/IssueList";
import { issuesQueryOptions } from "#/features/issues/queries";

export const Route = createFileRoute("/app/$code/issues/")({
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(issuesQueryOptions(params.code));
		return { code: context.access.workspace.code };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: IssuesPage,
});

function IssuesPage() {
	const { code } = Route.useLoaderData();

	return (
		<div className="dashboard-page">
			<div className="p-4">
				<h1 className="font-heading text-xl font-semibold">Issues</h1>
				<p className="text-xs text-muted-foreground">
					Track work in this workspace
				</p>
			</div>
			<Separator />
			<div className="flex-1 overflow-y-auto">
				<IssueList workspaceCode={code} />
			</div>
		</div>
	);
}
