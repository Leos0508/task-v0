import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	PRIORITIES,
	PriorityBadge,
	STATUSES,
	StatusBadge,
} from "#/features/issues/components/IssueBadges";
import IssueTagBadge from "#/features/issues/components/IssueTagBadge";
import { patchIssue } from "#/features/issues/patch-issue";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import { createAppColumnHelper } from "#/lib/data-table";
import { cn } from "#/lib/utils";

const columnHelper = createAppColumnHelper<IssueListItem>();

export function createIssueColumns(workspaceCode: string) {
	return columnHelper.columns([
		columnHelper.accessor("number", {
			header: "ID",
			cell: ({ getValue }) => `#${getValue()}`,
			meta: {
				className: "w-[1%] whitespace-nowrap font-mono text-muted-foreground",
			},
		}),
		columnHelper.accessor("title", {
			header: "Title",
			cell: ({ row, getValue }) => (
				<Link
					to="/app/$code/issues/$issueNumber"
					params={{
						code: workspaceCode,
						issueNumber: String(row.original.number),
					}}
					className="hover:underline font-medium"
				>
					{getValue()}
				</Link>
			),
			meta: { className: "w-full whitespace-nowrap" },
		}),
		columnHelper.accessor("status", {
			header: "Status",
			enableColumnFilter: true,
			filterFn: "equalsString",
			cell: ({ row }) => (
				<IssueStatusCell workspaceCode={workspaceCode} issue={row.original} />
			),
			meta: { className: "w-[1%] whitespace-nowrap" },
		}),
		columnHelper.accessor("priority", {
			header: "Priority",
			cell: ({ row }) => (
				<IssuePriorityCell workspaceCode={workspaceCode} issue={row.original} />
			),
			meta: { className: "w-[1%] whitespace-nowrap" },
		}),
		columnHelper.accessor("tags", {
			header: "Tags",
			cell: ({ getValue }) => {
				const tags = getValue();
				if (tags.length === 0) {
					return <span className="text-muted-foreground">—</span>;
				}
				return (
					<div className="flex flex-wrap gap-1">
						{tags.map((tag) => (
							<IssueTagBadge key={tag.id} tag={tag} />
						))}
					</div>
				);
			},
			meta: { className: "min-w-40" },
		}),
		columnHelper.accessor("reporterName", {
			header: "Reporter",
			meta: { className: "w-[1%] whitespace-nowrap" },
		}),
		columnHelper.accessor("updatedAt", {
			header: "Last edited",
			cell: ({ getValue }) => formatLastEdited(getValue()),
			meta: { className: "w-[1%] whitespace-nowrap text-muted-foreground" },
		}),
	]);
}

function IssueStatusCell({
	workspaceCode,
	issue,
}: {
	workspaceCode: string;
	issue: IssueListItem;
}) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					aria-label="Change status"
				>
					<StatusBadge status={issue.status} />
				</button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-44 gap-0.5 p-1">
				{STATUSES.map((status) => (
					<OptionButton
						key={status}
						selected={issue.status === status}
						onSelect={() => {
							setOpen(false);
							if (status !== issue.status) {
								void patchIssue(queryClient, workspaceCode, issue, { status });
							}
						}}
					>
						<StatusBadge status={status} />
					</OptionButton>
				))}
			</PopoverContent>
		</Popover>
	);
}

function IssuePriorityCell({
	workspaceCode,
	issue,
}: {
	workspaceCode: string;
	issue: IssueListItem;
}) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					aria-label="Change priority"
				>
					<PriorityBadge priority={issue.priority} />
				</button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-36 gap-0.5 p-1">
				{PRIORITIES.map((priority) => (
					<OptionButton
						key={priority ?? "none"}
						selected={issue.priority === priority}
						onSelect={() => {
							setOpen(false);
							if (priority !== issue.priority) {
								void patchIssue(queryClient, workspaceCode, issue, {
									priority,
								});
							}
						}}
					>
						<PriorityBadge priority={priority} />
					</OptionButton>
				))}
			</PopoverContent>
		</Popover>
	);
}

function OptionButton({
	selected,
	onSelect,
	children,
}: {
	selected: boolean;
	onSelect: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex w-full items-center rounded-md px-1.5 py-1 text-left text-sm outline-none hover:bg-accent",
				selected && "bg-accent",
			)}
			onClick={onSelect}
		>
			{children}
		</button>
	);
}

function formatLastEdited(iso: string) {
	return lastEditedFormatter.format(new Date(iso));
}

const lastEditedFormatter = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	year: "numeric",
});
