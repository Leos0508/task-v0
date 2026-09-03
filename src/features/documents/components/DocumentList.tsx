import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
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
import type { DocumentListItem } from "#/lib/data/fetch-documents";
import { useAppTable } from "#/lib/data-table";
import { createDocumentFn } from "#/lib/functions/documents.functions";
import { documentKeys, documentsQueryOptions } from "../queries";
import { createDocumentColumns } from "./document-column";

const EMPTY_DOCUMENT: DocumentListItem[] = [];

type DocumentSort = "updatedAt" | "createdAt" | "title";

function getDocumentRowId(row: DocumentListItem) {
	return row.id;
}

function sortDocuments(documents: DocumentListItem[], sort: DocumentSort) {
	return [...documents].sort((a, b) => {
		if (sort === "title") {
			return a.title.localeCompare(b.title);
		}
		return new Date(b[sort]).getTime() - new Date(a[sort]).getTime();
	});
}

export default function DocumentList({
	workspaceCode,
}: {
	workspaceCode: string;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: documents } = useQuery(documentsQueryOptions(workspaceCode));
	const [sort, setSort] = useState<DocumentSort>("updatedAt");
	const [isCreating, startCreate] = useTransition();

	const columns = useMemo(
		() => createDocumentColumns(workspaceCode),
		[workspaceCode],
	);

	const sortedDocuments = useMemo(
		() => sortDocuments(documents ?? EMPTY_DOCUMENT, sort),
		[documents, sort],
	);

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
				emptyMessage="No documents yet. Create one to get started."
			/>
		</div>
	);
}
