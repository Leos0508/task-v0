import { Link } from "@tanstack/react-router";
import type { DocumentListItem } from "#/lib/data/fetch-documents";
import { createAppColumnHelper } from "#/lib/data-table";

const columnHelper = createAppColumnHelper<DocumentListItem>();

export function createDocumentColumns(workspaceCode: string) {
	return columnHelper.columns([
		columnHelper.accessor("title", {
			header: "Title",
			cell: ({ row, getValue }) => (
				<Link
					to="/workspaces/$code/documents/$documentId"
					params={{ code: workspaceCode, documentId: row.original.id }}
					className="hover:underline font-medium"
				>
					{getValue()}
				</Link>
			),
			meta: { className: "w-full whitespace-nowrap" },
		}),
		columnHelper.accessor("updatedAt", {
			header: "Last edited",
			cell: ({ getValue }) => formatLastEdited(getValue()),
			meta: { className: "w-[1%] whitespace-nowrap text-muted-foreground" },
		}),
	]);
}

function formatLastEdited(iso: string) {
	return lastEditedFormatter.format(new Date(iso));
}

const lastEditedFormatter = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	year: "numeric",
});
