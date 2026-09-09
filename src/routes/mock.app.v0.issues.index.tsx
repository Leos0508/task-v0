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

export const Route = createFileRoute("/mock/app/v0/issues/")({
	validateSearch: issueViewSearchSchema,
	search: {
		middlewares: [stripSearchParams(issueSearchDefaults)],
	},
	component: MockIssuesPage,
});

function MockIssuesPage() {
	const { view, status, priority, tag } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	return (
		<div className="dashboard-page">
			<div className="flex items-center justify-between gap-4 p-4">
				<div>
					<h1 className="font-heading text-xl font-semibold">Issues</h1>
					<p className="text-xs text-muted-foreground">
						Track work in this workspace
					</p>
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
