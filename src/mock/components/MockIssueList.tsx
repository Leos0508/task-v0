import { PlusIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "#/components/ui/button";
import IssueFiltersPopover from "#/features/issues/components/IssueFiltersPopover";
import {
	countIssueFilters,
	type IssueFilters,
	type IssueView,
} from "#/features/issues/view-search";
import { cn } from "#/lib/utils";
import MockIssueBoard from "#/mock/components/MockIssueBoard";
import MockIssueGantt from "#/mock/components/MockIssueGantt";
import MockIssueTable from "#/mock/components/MockIssueTable";
import MockNewIssueDialog from "#/mock/components/MockNewIssueDialog";
import { mockIssues, mockTags } from "#/mock/fixtures";

export default function MockIssueList({
	view,
	filters,
	onFiltersChange,
}: {
	view: IssueView;
	filters: IssueFilters;
	onFiltersChange: (filters: IssueFilters) => void;
}) {
	const hasFilters = countIssueFilters(filters) > 0;

	const filteredIssues = useMemo(() => {
		const statuses = new Set(filters.status);
		const priorities = new Set(filters.priority);
		const tagIds = new Set(filters.tag);
		return mockIssues.filter((issue) => {
			if (statuses.size > 0 && !statuses.has(issue.status)) return false;
			if (
				priorities.size > 0 &&
				(issue.priority == null || !priorities.has(issue.priority))
			) {
				return false;
			}
			if (tagIds.size > 0 && !issue.tags.some((tag) => tagIds.has(tag.id))) {
				return false;
			}
			return true;
		});
	}, [filters.priority, filters.status, filters.tag]);

	const counts = { total: mockIssues.length, todo: 0, inProgress: 0, done: 0 };
	for (const issue of mockIssues) {
		if (issue.status === "TODO") counts.todo += 1;
		else if (issue.status === "IN_PROGRESS") counts.inProgress += 1;
		else if (issue.status === "DONE") counts.done += 1;
	}

	const emptyMessage = hasFilters
		? "No issues match these filters."
		: "No issues yet. Create one to get started.";

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col gap-4 p-4">
			<div className="grid gap-3 sm:grid-cols-4">
				<div className="rounded-lg border p-3">
					<p className="text-xs text-muted-foreground">Total</p>
					<p className="text-lg font-semibold">{counts.total}</p>
				</div>
				<div className="rounded-lg border p-3">
					<p className="text-xs text-muted-foreground">Todo</p>
					<p className="text-lg font-semibold">{counts.todo}</p>
				</div>
				<div className="rounded-lg border p-3">
					<p className="text-xs text-muted-foreground">In progress</p>
					<p className="text-lg font-semibold">{counts.inProgress}</p>
				</div>
				<div className="rounded-lg border p-3">
					<p className="text-xs text-muted-foreground">Done</p>
					<p className="text-lg font-semibold">{counts.done}</p>
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<IssueFiltersPopover
					tags={mockTags}
					filters={filters}
					onFiltersChange={onFiltersChange}
				/>
				<MockNewIssueDialog
					trigger={
						<Button>
							<PlusIcon />
							New issue
						</Button>
					}
				/>
			</div>
			<div
				className={cn(
					"min-h-0 min-w-0 flex-1",
					view === "gantt" ? "overflow-hidden" : "overflow-auto",
				)}
			>
				{view === "list" ? (
					<MockIssueTable issues={filteredIssues} emptyMessage={emptyMessage} />
				) : null}
				{view === "board" ? <MockIssueBoard issues={filteredIssues} /> : null}
				{view === "gantt" ? (
					<MockIssueGantt issues={filteredIssues} hasFilters={hasFilters} />
				) : null}
			</div>
		</div>
	);
}
