import {
	ChevronDownIcon,
	ChevronsUpDownIcon,
	ChevronsUpIcon,
	ChevronUpIcon,
	type LucideIcon,
	MinusIcon,
} from "lucide-react";
import type { IssuePriority, IssueStatus } from "#/db/schema";
import { cn } from "#/lib/utils";

export const STATUSES: IssueStatus[] = [
	"TODO",
	"IN_PROGRESS",
	"DONE",
	"CANCELLED",
];

export const PRIORITIES: Array<IssuePriority | null> = [
	"URGENT",
	"HIGH",
	"MEDIUM",
	"LOW",
	null,
];

export const STATUS_LABELS: Record<IssueStatus, string> = {
	TODO: "Todo",
	IN_PROGRESS: "In progress",
	DONE: "Done",
	CANCELLED: "Cancelled",
};

const statusDot: Record<IssueStatus, string> = {
	TODO: "bg-amber-400/80",
	IN_PROGRESS: "bg-blue-400/80",
	DONE: "bg-green-400/80",
	CANCELLED: "bg-red-400/80",
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
	LOW: "Low",
	MEDIUM: "Medium",
	HIGH: "High",
	URGENT: "Urgent",
};

const priorityIcon: Record<IssuePriority, LucideIcon> = {
	URGENT: ChevronsUpIcon,
	HIGH: ChevronUpIcon,
	MEDIUM: ChevronsUpDownIcon,
	LOW: ChevronDownIcon,
};

export function StatusBadge({ status }: { status: IssueStatus }) {
	return (
		<span className="inline-flex items-center gap-2">
			<span className={cn("size-3 rounded-full", statusDot[status])} />
			{STATUS_LABELS[status]}
		</span>
	);
}

export function PriorityBadge({
	priority,
}: {
	priority: IssuePriority | null;
}) {
	const Icon = priority ? priorityIcon[priority] : MinusIcon;

	return (
		<span className="inline-flex items-center gap-2">
			<Icon className="size-4" />
			<span className="leading-[100%]">
				{priority ? PRIORITY_LABELS[priority] : "None"}
			</span>
		</span>
	);
}
