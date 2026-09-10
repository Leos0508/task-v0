import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { createAppColumnHelper } from "#/lib/data-table";
import type { WorkspaceListItem } from "#/types/workspace";

const columnHelper = createAppColumnHelper<WorkspaceListItem>();

export const workspaceColumns = columnHelper.columns([
	columnHelper.display({
		id: "color",
		header: "Color",
		cell: ({ row }) => (
			<div
				className="size-4 rounded-full mx-auto"
				style={{ background: row.original.color }}
			/>
		),
		meta: { className: "w-8 text-center" },
	}),
	columnHelper.accessor("code", {
		header: "Code",
		meta: { className: "font-mono" },
	}),
	columnHelper.accessor("name", {
		header: "Name",
		enableSorting: true,
		sortDescFirst: false,
		sortFn: "text",
		cell: ({ row, getValue }) => (
			<Link
				to="/app/$code"
				params={{ code: row.original.code }}
				className="hover:underline font-medium"
			>
				{getValue()}
			</Link>
		),
		meta: { className: "w-full" },
	}),
	columnHelper.accessor("role", {
		header: "Role",
		cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
	}),
]);
