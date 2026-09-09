import { Link } from "@tanstack/react-router";
import { STATUS_LABELS } from "#/features/issues/components/IssueBadges";
import type { MockIssue } from "#/mock/fixtures";

const RANGE_START = Date.parse("2026-09-01T00:00:00.000Z");
const RANGE_END = Date.parse("2026-09-20T00:00:00.000Z");
const RANGE_MS = RANGE_END - RANGE_START;

function barStyle(issue: MockIssue) {
	const start = issue.startDate ? Date.parse(issue.startDate) : RANGE_START;
	const end = issue.endDate ? Date.parse(issue.endDate) : start + 86400000 * 2;
	const left = Math.max(0, ((start - RANGE_START) / RANGE_MS) * 100);
	const width = Math.max(4, ((end - start) / RANGE_MS) * 100);
	return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
}

export default function MockIssueGantt({
	issues,
	hasFilters,
}: {
	issues: MockIssue[];
	hasFilters: boolean;
}) {
	if (issues.length === 0) {
		return (
			<p className="p-4 text-sm text-muted-foreground">
				{hasFilters
					? "No issues match these filters."
					: "No dated issues to show on the gantt."}
			</p>
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-1">
			<p className="text-xs text-muted-foreground">
				Sep 1 – Sep 20 · static bars from fixture dates
			</p>
			<ul className="flex flex-col gap-2">
				{issues.map((issue) => (
					<li
						key={issue.id}
						className="grid grid-cols-[minmax(0,12rem)_1fr] items-center gap-3"
					>
						<div className="min-w-0">
							<p className="font-mono text-[11px] text-muted-foreground">
								TASK-{issue.number}
							</p>
							<Link
								to="/mock/app/v0/issues/$issueNumber"
								params={{ issueNumber: String(issue.number) }}
								className="block truncate text-sm font-medium hover:underline"
							>
								{issue.title}
							</Link>
							<p className="text-[11px] text-muted-foreground">
								{STATUS_LABELS[issue.status]}
							</p>
						</div>
						<div className="relative h-8 rounded-md bg-muted/60">
							<div
								className="absolute top-1.5 h-5 rounded-full bg-primary/80"
								style={barStyle(issue)}
							/>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
