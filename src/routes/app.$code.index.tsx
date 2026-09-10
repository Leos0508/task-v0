import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import { Separator } from "#/components/ui/separator";
import IssueList from "#/features/issues/components/IssueList";
import IssueViewControls from "#/features/issues/components/IssueViewControls";
import IssueViewTabs from "#/features/issues/components/IssueViewTabs";
import { ensureIssueListData } from "#/features/issues/ensure-issue-list-data";
import {
	issueSearchDefaults,
	issueViewSearchSchema,
} from "#/features/issues/view-search";

export const Route = createFileRoute("/app/$code/")({
	staleTime: 60_000,
	validateSearch: issueViewSearchSchema,
	search: {
		middlewares: [stripSearchParams(issueSearchDefaults)],
	},
	loaderDeps: ({ search }) => ({ viewId: search.viewId }),
	loader: async ({ context, params, deps }) => {
		await ensureIssueListData(
			context.queryClient,
			params.code,
			deps.viewId,
			"/app/$code/",
		);
		return { access: context.access };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: WorkspaceOverviewPage,
});

function WorkspaceOverviewPage() {
	const { access } = Route.useLoaderData();
	const search = Route.useSearch();
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
				<div className="flex flex-wrap items-center justify-end gap-2">
					<IssueViewControls
						workspaceCode={workspace.code}
						userId={access.user.id}
						role={access.role}
						search={search}
						onSearchChange={(next) =>
							navigate({ search: next, replace: true })
						}
					/>
					<IssueViewTabs
						view={search.view}
						onViewChange={(next) =>
							navigate({
								search: (prev) => ({ ...prev, view: next }),
								replace: true,
							})
						}
					/>
				</div>
			</div>
			<Separator />
			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				<IssueList
					workspaceCode={workspace.code}
					search={search}
					onSearchChange={(next) =>
						navigate({ search: next, replace: true })
					}
				/>
			</div>
		</div>
	);
}
