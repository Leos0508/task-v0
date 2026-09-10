import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PlusIcon, SearchIcon } from "lucide-react";
import ListSortPopover from "#/components/ListSortPopover";
import PageLoading from "#/components/PageLoading";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "#/components/ui/input-group";
import { workspaceColumns } from "#/features/workspaces/components/workspace-columns";
import { useAppTable } from "#/lib/data-table";
import type { WorkspaceListItem } from "#/types/workspace";
import { workspacesQueryOptions } from "../queries";

const EMPTY_WORKSPACES: WorkspaceListItem[] = [];
const WORKSPACE_TABLE_INITIAL_STATE = {
	sorting: [{ id: "name" as const, desc: false }],
};

function getWorkspaceRowId(row: WorkspaceListItem) {
	return row.id;
}

function canFilterWorkspaceColumn(column: { id: string }) {
	return column.id === "name" || column.id === "code";
}

export default function WorkspaceList() {
	const { data: workspaces } = useQuery(workspacesQueryOptions);

	const table = useAppTable({
		columns: workspaceColumns,
		data: workspaces ?? EMPTY_WORKSPACES,
		getRowId: getWorkspaceRowId,
		getColumnCanGlobalFilter: canFilterWorkspaceColumn,
		initialState: WORKSPACE_TABLE_INITIAL_STATE,
	});

	const sort = table.state.sorting[0]?.desc ? "desc" : "asc";
	const search = String(table.state.globalFilter ?? "");

	if (workspaces === undefined) return <PageLoading />;

	return (
		<div className="flex flex-col bg-background min-h-40 text-foreground w-full max-w-5xl">
			<div className="w-full flex items-center justify-between gap-8">
				<div className="flex-1 flex items-center gap-2">
					<ListSortPopover
						fields={[{ value: "name", label: "Name" }]}
						sort="name"
						dir={sort}
						defaultSort="name"
						defaultDir="asc"
						dirLabels={{ asc: "A-Z", desc: "Z-A" }}
						onChange={(next) =>
							table.setSorting([{ id: "name", desc: next.dir === "desc" }])
						}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Button asChild>
						<Link to="/app/create-workspace">
							New
							<PlusIcon />
						</Link>
					</Button>
					<InputGroup className="w-full max-w-48">
						<InputGroupInput
							placeholder="Search"
							value={search}
							onChange={(e) => table.setGlobalFilter(e.target.value)}
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
