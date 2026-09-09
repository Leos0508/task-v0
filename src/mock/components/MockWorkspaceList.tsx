import { Link } from "@tanstack/react-router";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { createAppColumnHelper, useAppTable } from "#/lib/data-table";
import { mockWorkspaces } from "#/mock/fixtures";
import type { WorkspaceListItem } from "#/types/workspace";

const columnHelper = createAppColumnHelper<WorkspaceListItem>();

const columns = columnHelper.columns([
	columnHelper.display({
		id: "color",
		header: "Color",
		cell: ({ row }) => (
			<div
				className="mx-auto size-4 rounded-full"
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
		sortFn: "text",
		cell: ({ getValue }) => (
			<Link to="/mock/app/v0" className="font-medium hover:underline">
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

function getWorkspaceRowId(row: WorkspaceListItem) {
	return row.id;
}

function canFilterWorkspaceColumn(column: { id: string }) {
	return column.id === "name" || column.id === "code";
}

const INITIAL_STATE = {
	sorting: [{ id: "name" as const, desc: false }],
};

export default function MockWorkspaceList() {
	const table = useAppTable({
		columns,
		data: mockWorkspaces,
		getRowId: getWorkspaceRowId,
		getColumnCanGlobalFilter: canFilterWorkspaceColumn,
		initialState: INITIAL_STATE,
	});

	const sort = table.state.sorting[0]?.desc ? "desc" : "asc";
	const search = String(table.state.globalFilter ?? "");

	return (
		<div className="flex min-h-40 w-full max-w-5xl flex-col bg-background text-foreground">
			<div className="flex w-full items-center justify-between gap-8">
				<div className="flex flex-1 items-center gap-2">
					<Select
						value={sort}
						onValueChange={(value) =>
							table.setSorting([{ id: "name", desc: value === "desc" }])
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Sort By" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Sort By</SelectLabel>
								<SelectItem value="asc">A-Z</SelectItem>
								<SelectItem value="desc">Z-A</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<Button asChild>
						<Link to="/mock/app/create-workspace">
							New
							<PlusIcon />
						</Link>
					</Button>
					<InputGroup className="w-full max-w-48">
						<InputGroupInput
							placeholder="Search"
							value={search}
							onChange={(event) => table.setGlobalFilter(event.target.value)}
						/>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
					</InputGroup>
				</div>
			</div>
			<DataTable
				className="my-2"
				table={table}
				emptyMessage="No workspaces match this filter."
			/>
		</div>
	);
}
