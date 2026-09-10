import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import ListSortPopover from "#/components/ListSortPopover";
import PageLoading from "#/components/PageLoading";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { createDocumentColumns } from "#/features/documents/components/document-column";
import {
	DOCUMENT_SORT_FIELDS,
	type DocumentSortField,
	documentSearchDefaults,
} from "#/features/documents/schema";
import { sortDocuments } from "#/features/documents/sort-documents";
import { tagsQueryOptions } from "#/features/issues/queries";
import type { DocumentListItem } from "#/lib/data/fetch-documents";
import { useAppTable } from "#/lib/data-table";
import { createDocumentFn } from "#/lib/functions/documents.functions";
import { nextListSort } from "#/lib/list-sort";
import { documentKeys, documentsQueryOptions } from "../queries";

const EMPTY_DOCUMENT: DocumentListItem[] = [];

const SORT_LABELS: Record<DocumentSortField, string> = {
	updatedAt: "Last edited",
	createdAt: "Date created",
	title: "Title",
};

const SORT_FIELDS = DOCUMENT_SORT_FIELDS.map((field) => ({
	value: field,
	label: SORT_LABELS[field],
}));

function getDocumentRowId(row: DocumentListItem) {
	return row.id;
}

export default function DocumentList({
	workspaceCode,
	sort,
	dir,
	onSortChange,
}: {
	workspaceCode: string;
	sort: DocumentSortField;
	dir: "asc" | "desc";
	onSortChange: (next: {
		sort: DocumentSortField;
		dir: "asc" | "desc";
	}) => void;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: documents } = useQuery(documentsQueryOptions(workspaceCode));
	const { data: tags = [] } = useQuery(tagsQueryOptions(workspaceCode));
	const [tagFilter, setTagFilter] = useState<string>("ALL");
	const [isCreating, startCreate] = useTransition();

	const handleSortField = useCallback(
		(field: DocumentSortField) => {
			onSortChange(nextListSort({ sort, dir }, field));
		},
		[dir, onSortChange, sort],
	);

	const columns = useMemo(
		() => createDocumentColumns(workspaceCode, sort, dir, handleSortField),
		[dir, handleSortField, sort, workspaceCode],
	);

	const sortedDocuments = useMemo(() => {
		const filtered = (documents ?? EMPTY_DOCUMENT).filter((document) => {
			if (tagFilter === "ALL") return true;
			return document.tags.some((tag) => tag.id === tagFilter);
		});
		return sortDocuments(filtered, sort, dir);
	}, [dir, documents, sort, tagFilter]);

	const table = useAppTable({
		columns,
		data: sortedDocuments,
		getRowId: getDocumentRowId,
	});

	function handleCreateNew() {
		if (isCreating) return;
		startCreate(async () => {
			const result = await createDocumentFn({
				data: { workspaceCode },
			});
			if (!result.success || result.data?.id == null) {
				toast.error(
					result.success ? "Failed to create document" : result.error.message,
				);
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: documentKeys.all(workspaceCode),
			});
			navigate({
				to: "/app/$code/documents/$documentId",
				params: { code: workspaceCode, documentId: result.data.id },
			});
		});
	}

	if (documents === undefined) return <PageLoading />;

	return (
		<div className="w-full space-y-2">
			<div className="flex w-full items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-2">
					<ListSortPopover
						fields={SORT_FIELDS}
						sort={sort}
						dir={dir}
						defaultSort={documentSearchDefaults.sort}
						defaultDir={documentSearchDefaults.dir}
						onChange={onSortChange}
					/>
					<Select value={tagFilter} onValueChange={setTagFilter}>
						<SelectTrigger className="w-44">
							<SelectValue placeholder="Tag" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">All tags</SelectItem>
							{tags.map((tag) => (
								<SelectItem key={tag.id} value={tag.id}>
									{tag.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button onClick={handleCreateNew} disabled={isCreating}>
					{isCreating ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						<PlusIcon />
					)}
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
