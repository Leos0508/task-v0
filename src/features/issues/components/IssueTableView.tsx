import { useMemo } from "react";
import { DataTable } from "#/components/ui/data-table";
import { createIssueColumns } from "#/features/issues/components/issue-columns";
import type { IssueSortField } from "#/features/issues/schema";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import { useAppTable } from "#/lib/data-table";

function getIssueRowId(row: IssueListItem) {
	return row.id;
}

export default function IssueTableView({
	workspaceCode,
	issues,
	sort,
	dir,
	onSort,
	emptyMessage = "No issues yet. Create one to get started.",
}: {
	workspaceCode: string;
	issues: IssueListItem[];
	sort: IssueSortField;
	dir: "asc" | "desc";
	onSort: (field: IssueSortField) => void;
	emptyMessage?: string;
}) {
	const columns = useMemo(
		() => createIssueColumns(workspaceCode, sort, dir, onSort),
		[dir, onSort, sort, workspaceCode],
	);

	const table = useAppTable({
		columns,
		data: issues,
		getRowId: getIssueRowId,
	});

	return <DataTable table={table} emptyMessage={emptyMessage} />;
}
