import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { Suspense, useMemo, useTransition } from "react";
import { toast } from "sonner";
import PageLoading from "#/components/PageLoading";
import { Button } from "#/components/ui/button";
import IssueBoardView from "#/features/issues/components/IssueBoardView";
import IssueFiltersPopover from "#/features/issues/components/IssueFiltersPopover";
import IssueTableView from "#/features/issues/components/IssueTableView";
import {
	issueKeys,
	issuesQueryOptions,
	tagsQueryOptions,
} from "#/features/issues/queries";
import {
	countIssueFilters,
	type IssueFilters,
	type IssueView,
} from "#/features/issues/view-search";
import { createIssueFn } from "#/lib/functions/issues.functions";
import { lazyImport } from "#/lib/stale-dynamic-import";
import { cn } from "#/lib/utils";

const IssueGanttView = lazyImport(
	() => import("#/features/issues/components/IssueGanttView"),
);

export default function IssueList({
	workspaceCode,
	view,
	filters,
	onFiltersChange,
}: {
	workspaceCode: string;
	view: IssueView;
	filters: IssueFilters;
	onFiltersChange: (filters: IssueFilters) => void;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: issues } = useQuery(issuesQueryOptions(workspaceCode));
	const { data: tags = [] } = useQuery(tagsQueryOptions(workspaceCode));
	const [isCreating, startCreate] = useTransition();
	const hasFilters = countIssueFilters(filters) > 0;

	const filteredIssues = useMemo(() => {
		if (!issues) return [];
		const statuses = new Set(filters.status);
		const priorities = new Set(filters.priority);
		const tagIds = new Set(filters.tag);
		return issues.filter((issue) => {
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
	}, [filters.priority, filters.status, filters.tag, issues]);

	function handleNewIssue() {
		if (isCreating) return;
		startCreate(async () => {
			const result = await createIssueFn({
				data: { workspaceCode },
			});
			if (!result.success || result.data?.number == null) {
				toast.error(
					result.success ? "Failed to create issue" : result.error.message,
				);
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: issueKeys.all(workspaceCode),
			});
			navigate({
				to: "/app/$code/issues/$issueNumber",
				params: {
					code: workspaceCode,
					issueNumber: String(result.data.number),
				},
			});
		});
	}

	if (issues === undefined) return <PageLoading />;

	const counts = { total: issues.length, todo: 0, inProgress: 0, done: 0 };
	for (const issue of issues) {
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
					tags={tags}
					filters={filters}
					onFiltersChange={onFiltersChange}
				/>
				<Button onClick={handleNewIssue} disabled={isCreating}>
					{isCreating ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						<PlusIcon />
					)}
					New issue
				</Button>
			</div>
			<div
				className={cn(
					"min-h-0 min-w-0 flex-1",
					view === "gantt" ? "overflow-hidden" : "overflow-auto",
				)}
			>
				{view === "list" ? (
					<IssueTableView
						workspaceCode={workspaceCode}
						issues={filteredIssues}
						emptyMessage={emptyMessage}
					/>
				) : null}
				{view === "board" ? (
					<IssueBoardView
						workspaceCode={workspaceCode}
						issues={filteredIssues}
					/>
				) : null}
				{view === "gantt" ? (
					<Suspense fallback={<PageLoading />}>
						<IssueGanttView
							workspaceCode={workspaceCode}
							issues={filteredIssues}
							hasFilters={hasFilters}
						/>
					</Suspense>
				) : null}
			</div>
		</div>
	);
}
