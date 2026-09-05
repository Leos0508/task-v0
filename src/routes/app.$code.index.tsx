import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import { Separator } from "#/components/ui/separator";
import IssueList from "#/features/issues/components/IssueList";
import IssueViewTabs from "#/features/issues/components/IssueViewTabs";
import {
	issuesQueryOptions,
	tagsQueryOptions,
} from "#/features/issues/queries";
import { issueViewSearchSchema } from "#/features/issues/view-search";

export const Route = createFileRoute("/app/$code/")({
	validateSearch: issueViewSearchSchema,
	search: {
		middlewares: [stripSearchParams({ view: "list" })],
	},
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(issuesQueryOptions(params.code)),
			context.queryClient.ensureQueryData(tagsQueryOptions(params.code)),
		]);
		return { access: context.access };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: WorkspaceOverviewPage,
});

function WorkspaceOverviewPage() {
	const { access } = Route.useLoaderData();
	const { view } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const { workspace } = access;

	return (
		<div className="dashboard-page">
			<div className="flex items-center justify-between gap-4 p-4">
				<div className="flex min-w-0 items-center gap-3">
					<span
						className="size-4 shrink-0 rounded-full"
						style={{ background: workspace.color }}
					/>
					<div className="min-w-0">
						<h1 className="font-heading text-xl font-semibold">
							{workspace.name}
						</h1>
						<p className="font-mono text-xs text-muted-foreground">
							{workspace.code}
						</p>
					</div>
				</div>
				<IssueViewTabs
					view={view}
					onViewChange={(next) =>
						navigate({ search: (prev) => ({ ...prev, view: next }) })
					}
				/>
			</div>
			<Separator />
			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				<IssueList workspaceCode={workspace.code} view={view} />
			</div>
		</div>
	);
}
