import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import { Separator } from "#/components/ui/separator";
import IssueViewTabs from "#/features/issues/components/IssueViewTabs";
import {
	issueSearchDefaults,
	issueViewSearchSchema,
} from "#/features/issues/view-search";
import MockIssueList from "#/mock/components/MockIssueList";
import { mockWorkspace } from "#/mock/fixtures";

export const Route = createFileRoute("/mock/app/v0/")({
	validateSearch: issueViewSearchSchema,
	search: {
		middlewares: [stripSearchParams(issueSearchDefaults)],
	},
	component: MockOverviewPage,
});

function MockOverviewPage() {
	const { view, status, priority, tag } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	return (
		<div className="dashboard-page">
			<div className="flex items-center justify-between gap-4 p-4">
				<div className="flex min-w-0 items-center gap-3">
					<span
						className="size-4 shrink-0 rounded-full"
						style={{ background: mockWorkspace.color }}
					/>
					<div className="min-w-0">
						<h1 className="font-heading text-xl font-semibold">
							{mockWorkspace.name}
						</h1>
						<p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
							{mockWorkspace.code}
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
				<MockIssueList
					view={view}
					filters={{ status, priority, tag }}
					onFiltersChange={(filters) =>
						navigate({ search: (prev) => ({ ...prev, ...filters }) })
					}
				/>
			</div>
		</div>
	);
}
