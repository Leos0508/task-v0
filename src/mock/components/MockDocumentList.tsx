import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { createAppColumnHelper, useAppTable } from "#/lib/data-table";
import MockTagBadge from "#/mock/components/MockTagBadge";
import { type MockDocument, mockDocuments, mockTags } from "#/mock/fixtures";

const columnHelper = createAppColumnHelper<MockDocument>();

const lastEditedFormatter = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	year: "numeric",
});

const columns = columnHelper.columns([
	columnHelper.accessor("title", {
		header: "Title",
		cell: ({ row, getValue }) => (
			<Link
				to="/mock/app/v0/documents/$documentId"
				params={{ documentId: row.original.slug }}
				className="font-medium hover:underline"
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
						<MockTagBadge key={tag.id} tag={tag} />
					))}
				</div>
			);
		},
		meta: { className: "min-w-40" },
	}),
	columnHelper.accessor("updatedAt", {
		header: "Last edited",
		cell: ({ getValue }) => lastEditedFormatter.format(new Date(getValue())),
		meta: { className: "w-[1%] whitespace-nowrap text-muted-foreground" },
	}),
]);

type DocumentSort = "updatedAt" | "createdAt" | "title";

function sortDocuments(documents: MockDocument[], sort: DocumentSort) {
	return [...documents].sort((a, b) => {
		if (sort === "title") {
			return a.title.localeCompare(b.title);
		}
		return new Date(b[sort]).getTime() - new Date(a[sort]).getTime();
	});
}

export default function MockDocumentList() {
	const [sort, setSort] = useState<DocumentSort>("updatedAt");
	const [tagFilter, setTagFilter] = useState("ALL");

	const sortedDocuments = useMemo(() => {
		const filtered = mockDocuments.filter((document) => {
			if (tagFilter === "ALL") return true;
			return document.tags.some((tag) => tag.id === tagFilter);
		});
		return sortDocuments(filtered, sort);
	}, [sort, tagFilter]);

	const table = useAppTable({
		columns,
		data: sortedDocuments,
		getRowId: (row) => row.id,
	});

	return (
		<div className="w-full space-y-2">
			<div className="flex w-full items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={sort}
						onValueChange={(value) => setSort(value as DocumentSort)}
					>
						<SelectTrigger className="w-44">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="updatedAt">Last edited</SelectItem>
							<SelectItem value="createdAt">Date created</SelectItem>
							<SelectItem value="title">Title</SelectItem>
						</SelectContent>
					</Select>
					<Select value={tagFilter} onValueChange={setTagFilter}>
						<SelectTrigger className="w-44">
							<SelectValue placeholder="Tag" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All tags</SelectItem>
							{mockTags.map((tag) => (
								<SelectItem key={tag.id} value={tag.id}>
									{tag.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					onClick={() => toast.message("Mock only — no document created")}
				>
					<PlusIcon />
					Create New
				</Button>
			</div>
			<DataTable
				table={table}
				emptyMessage={
					tagFilter === "ALL"
						? "No documents yet. Create one to get started."
						: "No documents with this tag."
				}
			/>
		</div>
	);
}
