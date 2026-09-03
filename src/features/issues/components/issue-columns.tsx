import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import type { IssuePriority, IssueStatus } from "#/db/schema";
import {
	PRIORITIES,
	PriorityBadge,
	STATUSES,
	StatusBadge,
} from "#/features/issues/components/IssueBadges";
import { issueKeys } from "#/features/issues/queries";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import { createAppColumnHelper } from "#/lib/data-table";
import { updateIssueFn } from "#/lib/functions/issues.functions";
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

async function patchIssue(
	queryClient: QueryClient,
	workspaceCode: string,
	issue: IssueListItem,
	patch: {
		status?: IssueStatus;
		priority?: IssuePriority | null;
	},
) {
	const key = issueKeys.all(workspaceCode);
	const previous = queryClient.getQueryData<IssueListItem[]>(key);

	queryClient.setQueryData<IssueListItem[]>(key, (rows) =>
		rows?.map((row) =>
			row.id === issue.id
				? { ...row, ...patch, updatedAt: new Date().toISOString() }
				: row,
		),
	);

	const result = await updateIssueFn({
		data: {
			workspaceCode,
			issueNumber: issue.number,
			input: patch,
		},
	});
	if (!result.success) {
		queryClient.setQueryData(key, previous);
		toast.error(result.error.message);
		return;
	}

	await queryClient.invalidateQueries({ queryKey: key });
}
