import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import { Separator } from "#/components/ui/separator";
import IssueList from "#/features/issues/components/IssueList";
import { issuesQueryOptions } from "#/features/issues/queries";
import { issueViewSearchSchema } from "#/features/issues/view-search";

export const Route = createFileRoute("/app/$code/issues/")({
	validateSearch: issueViewSearchSchema,
	search: {
		middlewares: [stripSearchParams({ view: "list" })],
	},
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
	const { view } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	return (
		<div className="dashboard-page">
			<div className="p-4">
				<h1 className="font-heading text-xl font-semibold">Issues</h1>
				<p className="text-xs text-muted-foreground">
					Track work in this workspace
				</p>
			</div>
			<Separator />
			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				<IssueList
					workspaceCode={code}
					view={view}
					onViewChange={(next) =>
						navigate({ search: (prev) => ({ ...prev, view: next }) })
					}
				/>
			</div>
		</div>
	);
}
