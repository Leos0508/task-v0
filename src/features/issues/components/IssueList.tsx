import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { Suspense, useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";
import ListSortPopover from "#/components/ListSortPopover";
import PageLoading from "#/components/PageLoading";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import IssueBoardCardPopover from "#/features/issues/components/IssueBoardCardPopover";
import IssueBoardView from "#/features/issues/components/IssueBoardView";
import IssueFiltersPopover from "#/features/issues/components/IssueFiltersPopover";
import IssueTableView from "#/features/issues/components/IssueTableView";
import {
	issueKeys,
	issuesQueryOptions,
	tagsQueryOptions,
} from "#/features/issues/queries";
import {
	ISSUE_GRAPH_GROUP_BY,
	ISSUE_SORT_FIELDS,
	type IssueGraphGroupBy,
	type IssueSortField,
} from "#/features/issues/schema";
import { sortIssues } from "#/features/issues/sort-issues";
import {
	countIssueFilters,
	type IssueViewSearch,
	issueSearchDefaults,
} from "#/features/issues/view-search";
import { createIssueFn } from "#/lib/functions/issues.functions";
import { nextListSort } from "#/lib/list-sort";
import { lazyImport } from "#/lib/stale-dynamic-import";
import { cn } from "#/lib/utils";

const IssueGanttView = lazyImport(
	() => import("#/features/issues/components/IssueGanttView"),
);

const IssueChartPanel = lazyImport(
	() => import("#/features/issues/components/IssueChartPanel"),
);

const SORT_LABELS: Record<IssueSortField, string> = {
	number: "Number",
	title: "Title",
	status: "Status",
	priority: "Priority",
	createdAt: "Created",
	updatedAt: "Updated",
	startDate: "Start",
	endDate: "End",
};

const SORT_FIELDS = ISSUE_SORT_FIELDS.map((field) => ({
	value: field,
	label: SORT_LABELS[field],
}));

const GROUP_BY_LABELS: Record<IssueGraphGroupBy, string> = {
	status: "Status",
	priority: "Priority",
	tag: "Tag",
};

export default function IssueList({
	workspaceCode,
	search,
	onSearchChange,
}: {
	workspaceCode: string;
	search: IssueViewSearch;
	onSearchChange: (search: IssueViewSearch) => void;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: issues } = useQuery(issuesQueryOptions(workspaceCode));
	const { data: tags = [] } = useQuery(tagsQueryOptions(workspaceCode));
	const [isCreating, startCreate] = useTransition();
	const filters = {
		status: search.status,
		priority: search.priority,
		tag: search.tag,
	};
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

	const displayIssues = useMemo(() => {
		if (search.view === "board") return filteredIssues;
		return sortIssues(filteredIssues, search.sort, search.dir);
	}, [filteredIssues, search.dir, search.sort, search.view]);

	const handleSortField = useCallback(
		(field: IssueSortField) => {
			const next = nextListSort({ sort: search.sort, dir: search.dir }, field);
			onSearchChange({ ...search, sort: next.sort, dir: next.dir });
		},
		[onSearchChange, search],
	);

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
			{search.graph ? (
				<Suspense
					fallback={
						<div className="flex h-44 items-center justify-center rounded-lg border">
							<PageLoading />
						</div>
					}
				>
					<IssueChartPanel
						issues={filteredIssues}
						tags={tags}
						groupBy={search.groupBy}
						emptyMessage={emptyMessage}
					/>
				</Suspense>
			) : (
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
			)}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-2">
					<IssueFiltersPopover
						tags={tags}
						filters={filters}
						onFiltersChange={(next) => onSearchChange({ ...search, ...next })}
					/>
					{search.view === "board" ? (
						<IssueBoardCardPopover
							card={search.card}
							onChange={(card) => onSearchChange({ ...search, card })}
						/>
					) : (
						<ListSortPopover
							fields={SORT_FIELDS}
							sort={search.sort}
							dir={search.dir}
							defaultSort={issueSearchDefaults.sort}
							defaultDir={issueSearchDefaults.dir}
							onChange={(next) =>
								onSearchChange({
									...search,
									sort: next.sort,
									dir: next.dir,
								})
							}
						/>
					)}
					<div className="flex items-center gap-2">
						<Switch
							id="issue-graph"
							size="sm"
							checked={search.graph}
							onCheckedChange={(checked) =>
								onSearchChange({ ...search, graph: checked })
							}
						/>
						<Label htmlFor="issue-graph" className="font-normal">
							Graph
						</Label>
					</div>
					{search.graph ? (
						<Select
							value={search.groupBy}
							onValueChange={(value) =>
								onSearchChange({
									...search,
									groupBy: value as IssueGraphGroupBy,
								})
							}
						>
							<SelectTrigger aria-label="Group graph by" className="min-w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ISSUE_GRAPH_GROUP_BY.map((groupBy) => (
									<SelectItem key={groupBy} value={groupBy}>
										{GROUP_BY_LABELS[groupBy]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : null}
				</div>
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
					search.view === "list" ? "overflow-auto" : "overflow-hidden",
				)}
			>
				{search.view === "list" ? (
					<IssueTableView
						workspaceCode={workspaceCode}
						issues={displayIssues}
						sort={search.sort}
						dir={search.dir}
						onSort={handleSortField}
						emptyMessage={emptyMessage}
					/>
				) : null}
				{search.view === "board" ? (
					<IssueBoardView
						workspaceCode={workspaceCode}
						issues={displayIssues}
						cardFields={search.card}
					/>
				) : null}
				{search.view === "gantt" ? (
					<Suspense fallback={<PageLoading />}>
						<IssueGanttView
							workspaceCode={workspaceCode}
							issues={displayIssues}
							hasFilters={hasFilters}
						/>
					</Suspense>
				) : null}
			</div>
		</div>
	);
}
