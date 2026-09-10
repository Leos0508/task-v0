import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import {
	PRIORITY_LABELS,
	STATUS_LABELS,
	STATUSES,
} from "#/features/issues/components/IssueBadges";
import type { IssueGraphGroupBy } from "#/features/issues/schema";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import type { IssueTag } from "#/lib/data/fetch-tags";

const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW", "none"] as const;

const chartConfig = {
	count: {
		label: "Issues",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export default function IssueChartPanel({
	issues,
	tags,
	groupBy,
	emptyMessage,
}: {
	issues: IssueListItem[];
	tags: IssueTag[];
	groupBy: IssueGraphGroupBy;
	emptyMessage: string;
}) {
	const data = useMemo(() => {
		if (groupBy === "status") {
			const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
			for (const issue of issues) {
				counts[issue.status] += 1;
			}
			return STATUSES.map((status, index) => ({
				name: STATUS_LABELS[status],
				count: counts[status],
				fill: `var(--chart-${(index % 5) + 1})`,
			}));
		}
		if (groupBy === "priority") {
			const counts: Record<string, number> = {
				URGENT: 0,
				HIGH: 0,
				MEDIUM: 0,
				LOW: 0,
				none: 0,
			};
			for (const issue of issues) {
				counts[issue.priority ?? "none"] += 1;
			}
			return PRIORITY_ORDER.map((priority, index) => ({
				name: priority === "none" ? "None" : PRIORITY_LABELS[priority],
				count: counts[priority],
				fill: `var(--chart-${(index % 5) + 1})`,
			}));
		}
		const counts = new Map<string, number>();
		for (const issue of issues) {
			if (issue.tags.length === 0) {
				counts.set("none", (counts.get("none") ?? 0) + 1);
				continue;
			}
			for (const tag of issue.tags) {
				counts.set(tag.id, (counts.get(tag.id) ?? 0) + 1);
			}
		}
		const rows = tags
			.filter((tag) => (counts.get(tag.id) ?? 0) > 0)
			.map((tag, index) => ({
				name: tag.name,
				count: counts.get(tag.id) ?? 0,
				fill: `var(--chart-${(index % 5) + 1})`,
			}));
		const untagged = counts.get("none") ?? 0;
		if (untagged > 0) {
			rows.push({
				name: "No tag",
				count: untagged,
				fill: `var(--chart-${(rows.length % 5) + 1})`,
			});
		}
		return rows;
	}, [groupBy, issues, tags]);

	if (issues.length === 0) {
		return (
			<div className="flex h-44 items-center justify-center rounded-lg border">
				<p className="text-sm text-muted-foreground">{emptyMessage}</p>
			</div>
		);
	}

	if (groupBy === "tag" && data.length === 0) {
		return (
			<div className="flex h-44 items-center justify-center rounded-lg border">
				<p className="text-sm text-muted-foreground">
					No tags on these issues.
				</p>
			</div>
		);
	}

	return (
		<ChartContainer config={chartConfig} className="h-44 w-full aspect-auto">
			<BarChart data={data} accessibilityLayer>
				<CartesianGrid vertical={false} />
				<XAxis dataKey="name" tickLine={false} axisLine={false} />
				<YAxis allowDecimals={false} tickLine={false} axisLine={false} />
				<ChartTooltip content={<ChartTooltipContent hideLabel />} />
				<Bar dataKey="count" radius={4} />
			</BarChart>
		</ChartContainer>
	);
}
