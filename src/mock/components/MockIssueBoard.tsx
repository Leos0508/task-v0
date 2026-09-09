import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import type { IssueStatus } from "#/db/schema";
import {
	PriorityBadge,
	STATUS_LABELS,
	STATUSES,
} from "#/features/issues/components/IssueBadges";
import { cn } from "#/lib/utils";
import MockTagBadge from "#/mock/components/MockTagBadge";
import type { MockIssue } from "#/mock/fixtures";

export default function MockIssueBoard({ issues }: { issues: MockIssue[] }) {
	const grouped = useMemo(() => {
		const columns = Object.fromEntries(
			STATUSES.map((status) => [status, [] as MockIssue[]]),
		) as Record<IssueStatus, MockIssue[]>;

		for (const issue of issues) {
			columns[issue.status].push(issue);
		}

		return columns;
	}, [issues]);

	return (
		<div className="grid min-h-112 auto-rows-fr gap-3 md:grid-cols-4">
			{STATUSES.map((status) => (
				<section
					key={status}
					className="flex min-h-64 flex-col gap-2 rounded-lg border bg-muted/30 p-2"
				>
					<header className="flex items-center justify-between px-1 py-1">
						<h2 className="text-sm font-medium">{STATUS_LABELS[status]}</h2>
						<span className="text-xs text-muted-foreground">
							{grouped[status].length}
						</span>
					</header>
					<div className="flex flex-1 flex-col">
						{grouped[status].length === 0 ? (
							<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
								Nothing in {STATUS_LABELS[status].toLowerCase()}.
							</div>
						) : (
							grouped[status].map((issue) => (
								<BoardCard key={issue.id} issue={issue} />
							))
						)}
					</div>
				</section>
			))}
		</div>
	);
}

function BoardCard({ issue }: { issue: MockIssue }) {
	return (
		<div className="relative pb-2 last:pb-0">
			<div className={cn("relative rounded-md border bg-card p-2 shadow-none")}>
				<p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
					TASK-{issue.number}
				</p>
				<Link
					to="/mock/app/v0/issues/$issueNumber"
					params={{ issueNumber: String(issue.number) }}
					className="mt-0.5 block text-sm font-medium leading-snug hover:underline"
				>
					{issue.title}
				</Link>
				<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
					{issue.description}
				</p>
				<div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
					<PriorityBadge priority={issue.priority} />
					{issue.tags.slice(0, 3).map((tag) => (
						<MockTagBadge key={tag.id} tag={tag} />
					))}
				</div>
			</div>
		</div>
	);
}
