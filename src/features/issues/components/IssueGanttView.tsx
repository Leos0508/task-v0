import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import Gantt from "frappe-gantt";
import { useEffect, useMemo, useRef } from "react";
import { PriorityBadge } from "#/features/issues/components/IssueBadges";
import { patchIssue } from "#/features/issues/patch-issue";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import "./issue-gantt.css";

function formatDateOnly(value: Date) {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function toGanttTasks(issues: IssueListItem[]) {
	return issues.map((issue) => ({
		id: issue.id,
		name: `#${issue.number} ${issue.title}`,
		start: issue.startDate as string,
		end: issue.endDate as string,
		progress: 0,
	}));
}

export default function IssueGanttView({
	workspaceCode,
	issues,
}: {
	workspaceCode: string;
	issues: IssueListItem[];
}) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const chartRef = useRef<HTMLDivElement>(null);
	const issuesRef = useRef(issues);
	const skipClickRef = useRef(false);

	issuesRef.current = issues;

	const scheduled = useMemo(
		() => issues.filter((issue) => issue.startDate && issue.endDate),
		[issues],
	);
	const unscheduled = useMemo(
		() => issues.filter((issue) => !issue.startDate || !issue.endDate),
		[issues],
	);

	useEffect(() => {
		const container = chartRef.current;
		if (!container || scheduled.length === 0) {
			if (container) container.innerHTML = "";
			return;
		}

		new Gantt(container, toGanttTasks(scheduled), {
			view_mode: "Week",
			readonly_progress: true,
			popup: false,
			today_button: true,
			view_mode_select: true,
			infinite_padding: false,
			on_click: (task) => {
				if (skipClickRef.current) {
					skipClickRef.current = false;
					return;
				}
				const issue = issuesRef.current.find((row) => row.id === task.id);
				if (!issue) return;
				navigate({
					to: "/app/$code/issues/$issueNumber",
					params: {
						code: workspaceCode,
						issueNumber: String(issue.number),
					},
				});
			},
			on_date_change: (task, start, end) => {
				skipClickRef.current = true;
				const issue = issuesRef.current.find((row) => row.id === task.id);
				if (!issue) return;
				const startDate = formatDateOnly(start);
				const endDate = formatDateOnly(end);
				if (issue.startDate === startDate && issue.endDate === endDate) return;
				void patchIssue(queryClient, workspaceCode, issue, {
					startDate,
					endDate,
				});
			},
		});

		return () => {
			container.innerHTML = "";
		};
	}, [navigate, queryClient, scheduled, workspaceCode]);

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col gap-4">
			{unscheduled.length > 0 ? (
				<section className="shrink-0 rounded-lg border p-3">
					<h2 className="text-sm font-medium">Unscheduled</h2>
					<p className="mb-2 text-xs text-muted-foreground">
						Issues without a start and end date stay here
					</p>
					<ul className="flex max-h-36 flex-col gap-2 overflow-y-auto">
						{unscheduled.map((issue) => (
							<li
								key={issue.id}
								className="flex items-center justify-between gap-3"
							>
								<Link
									to="/app/$code/issues/$issueNumber"
									params={{
										code: workspaceCode,
										issueNumber: String(issue.number),
									}}
									className="truncate text-sm font-medium hover:underline"
								>
									#{issue.number} {issue.title}
								</Link>
								<PriorityBadge priority={issue.priority} />
							</li>
						))}
					</ul>
				</section>
			) : null}
			{scheduled.length === 0 ? (
				<p className="flex min-h-0 flex-1 items-center rounded-lg border p-6 text-sm text-muted-foreground">
					No scheduled issues. Set a start and end date on an issue to see it
					here.
				</p>
			) : (
				<div ref={chartRef} className="issue-gantt min-h-0 min-w-0 flex-1" />
			)}
		</div>
	);
}
