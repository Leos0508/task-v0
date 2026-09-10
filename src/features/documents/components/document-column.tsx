import { Link } from "@tanstack/react-router";
import ListSortHeader from "#/components/ListSortHeader";
import type { DocumentSortField } from "#/features/documents/schema";
import IssueTagBadge from "#/features/issues/components/IssueTagBadge";
import type { DocumentListItem } from "#/lib/data/fetch-documents";
import { createAppColumnHelper } from "#/lib/data-table";

const columnHelper = createAppColumnHelper<DocumentListItem>();

function sortHeader(
	label: string,
	field: DocumentSortField,
	sort: DocumentSortField,
	dir: "asc" | "desc",
	onSort: (field: DocumentSortField) => void,
) {
	return (
		<ListSortHeader
			label={label}
			direction={sort === field ? dir : false}
			onClick={() => onSort(field)}
		/>
	);
}

export function createDocumentColumns(
	workspaceCode: string,
	sort: DocumentSortField,
	dir: "asc" | "desc",
	onSort: (field: DocumentSortField) => void,
) {
	return columnHelper.columns([
		columnHelper.accessor("title", {
			header: () => sortHeader("Title", "title", sort, dir, onSort),
			cell: ({ row, getValue }) => (
				<Link
					to="/app/$code/documents/$documentId"
					params={{ code: workspaceCode, documentId: row.original.id }}
					className="hover:underline font-medium"
				>
					{getValue()}
				</Link>
			),
			meta: { className: "w-full whitespace-nowrap" },
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
		columnHelper.accessor("updatedAt", {
			header: () => sortHeader("Last edited", "updatedAt", sort, dir, onSort),
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
