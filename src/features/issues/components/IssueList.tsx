import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { Suspense, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import PageLoading from "#/components/PageLoading";
import { Button } from "#/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { IssuePriority, IssueStatus } from "#/db/schema";
import IssueBoardView from "#/features/issues/components/IssueBoardView";
import IssueTableView from "#/features/issues/components/IssueTableView";
import {
	issueKeys,
	issuesQueryOptions,
	tagsQueryOptions,
} from "#/features/issues/queries";
import type { IssueView } from "#/features/issues/view-search";
import { createIssueFn } from "#/lib/functions/issues.functions";
import { lazyImport } from "#/lib/stale-dynamic-import";
import { cn } from "#/lib/utils";

const IssueGanttView = lazyImport(
	() => import("#/features/issues/components/IssueGanttView"),
);

export default function IssueList({
	workspaceCode,
	view,
}: {
	workspaceCode: string;
	view: IssueView;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: issues } = useQuery(issuesQueryOptions(workspaceCode));
	const { data: tags = [] } = useQuery(tagsQueryOptions(workspaceCode));
	const [isCreating, startCreate] = useTransition();
	const [statusFilter, setStatusFilter] = useState<IssueStatus | "ALL">("ALL");
	const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "ALL">(
		"ALL",
	);
	const [tagFilter, setTagFilter] = useState<string>("ALL");

	const filteredIssues = useMemo(() => {
		if (!issues) return [];
		return issues.filter((issue) => {
			if (statusFilter !== "ALL" && issue.status !== statusFilter) return false;
			if (priorityFilter !== "ALL" && issue.priority !== priorityFilter) {
				return false;
			}
			if (
				tagFilter !== "ALL" &&
				!issue.tags.some((tag) => tag.id === tagFilter)
			) {
				return false;
			}
			return true;
		});
	}, [issues, priorityFilter, statusFilter, tagFilter]);

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
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={statusFilter}
						onValueChange={(value) =>
							setStatusFilter(value === "ALL" ? "ALL" : (value as IssueStatus))
						}
					>
						<SelectTrigger className="w-44">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All statuses</SelectItem>
							<SelectItem value="TODO">Todo</SelectItem>
							<SelectItem value="IN_PROGRESS">In progress</SelectItem>
							<SelectItem value="DONE">Done</SelectItem>
							<SelectItem value="CANCELLED">Cancelled</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={priorityFilter}
						onValueChange={(value) =>
							setPriorityFilter(
								value === "ALL" ? "ALL" : (value as IssuePriority),
							)
						}
					>
						<SelectTrigger className="w-44">
							<SelectValue placeholder="Priority" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All priorities</SelectItem>
							<SelectItem value="LOW">Low</SelectItem>
							<SelectItem value="MEDIUM">Medium</SelectItem>
							<SelectItem value="HIGH">High</SelectItem>
							<SelectItem value="URGENT">Urgent</SelectItem>
						</SelectContent>
					</Select>
					<Select value={tagFilter} onValueChange={setTagFilter}>
						<SelectTrigger className="w-44">
							<SelectValue placeholder="Tag" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All tags</SelectItem>
							{tags.map((tag) => (
								<SelectItem key={tag.id} value={tag.id}>
									{tag.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
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
					view === "gantt" ? "overflow-hidden" : "overflow-auto",
				)}
			>
				{view === "list" ? (
					<IssueTableView
						workspaceCode={workspaceCode}
						issues={filteredIssues}
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
						/>
					</Suspense>
				) : null}
			</div>
		</div>
	);
}
