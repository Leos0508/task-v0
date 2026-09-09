import { Link } from "@tanstack/react-router";
import { DataTable } from "#/components/ui/data-table";
import {
	PriorityBadge,
	StatusBadge,
} from "#/features/issues/components/IssueBadges";
import { createAppColumnHelper, useAppTable } from "#/lib/data-table";
import MockTagBadge from "#/mock/components/MockTagBadge";
import type { MockIssue } from "#/mock/fixtures";

const columnHelper = createAppColumnHelper<MockIssue>();

const lastEditedFormatter = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	year: "numeric",
});

const columns = columnHelper.columns([
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
				to="/mock/app/v0/issues/$issueNumber"
				params={{ issueNumber: String(row.original.number) }}
				className="font-medium hover:underline"
			>
				{getValue()}
			</Link>
		),
		meta: { className: "w-full whitespace-nowrap" },
	}),
	columnHelper.accessor("status", {
		header: "Status",
		cell: ({ getValue }) => <StatusBadge status={getValue()} />,
		meta: { className: "w-[1%] whitespace-nowrap" },
	}),
	columnHelper.accessor("priority", {
		header: "Priority",
		cell: ({ getValue }) => <PriorityBadge priority={getValue()} />,
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
						<MockTagBadge key={tag.id} tag={tag} />
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
		cell: ({ getValue }) => lastEditedFormatter.format(new Date(getValue())),
		meta: { className: "w-[1%] whitespace-nowrap text-muted-foreground" },
	}),
]);

function getIssueRowId(row: MockIssue) {
	return row.id;
}

export default function MockIssueTable({
	issues,
	emptyMessage,
}: {
	issues: MockIssue[];
	emptyMessage: string;
}) {
	const table = useAppTable({
		columns,
		data: issues,
		getRowId: getIssueRowId,
	});

	return <DataTable table={table} emptyMessage={emptyMessage} />;
}
