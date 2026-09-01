import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PlusIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	documentKeys,
	documentsQueryOptions,
} from "#/features/documents/queries";
import type { IssueLinkedDocument } from "#/lib/data/fetch-issue";
import {
	linkIssueToDocumentFn,
	unlinkIssueFromDocumentFn,
} from "#/lib/functions/documents.functions";
import { issueKeys } from "../queries";

type IssueLinkedDocumentsProps = {
	workspaceCode: string;
	issueNumber: number;
	linkedDocuments: IssueLinkedDocument[];
	onLinkedDocumentsChange: (documents: IssueLinkedDocument[]) => void;
};

export default function IssueLinkedDocuments({
	workspaceCode,
	issueNumber,
	linkedDocuments,
	onLinkedDocumentsChange,
}: IssueLinkedDocumentsProps) {
	const queryClient = useQueryClient();
	const { data: documents = [] } = useQuery(
		documentsQueryOptions(workspaceCode),
	);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	const linkedIds = useMemo(
		() => new Set(linkedDocuments.map((document) => document.id)),
		[linkedDocuments],
	);

	const available = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return documents.filter((document) => {
			if (linkedIds.has(document.id)) return false;
			if (!needle) return true;
			return document.title.toLowerCase().includes(needle);
		});
	}, [documents, linkedIds, query]);

	async function invalidate() {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: documentKeys.all(workspaceCode),
			}),
			queryClient.invalidateQueries({
				queryKey: issueKeys.all(workspaceCode),
			}),
		]);
	}

	async function handleLink(
		documentId: string,
		title: string,
		updatedAt: string,
	) {
		const result = await linkIssueToDocumentFn({
			data: {
				workspaceCode,
				documentId,
				issueNumber,
			},
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}

		onLinkedDocumentsChange([
			{ id: documentId, title, updatedAt },
			...linkedDocuments,
		]);
		setOpen(false);
		setQuery("");
		await invalidate();
	}

	async function handleUnlink(documentId: string) {
		const result = await unlinkIssueFromDocumentFn({
			data: {
				workspaceCode,
				documentId,
				issueNumber,
			},
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}

		onLinkedDocumentsChange(
			linkedDocuments.filter((document) => document.id !== documentId),
		);
		await invalidate();
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<p className="text-xs text-muted-foreground">Documents</p>
				<Popover
					open={open}
					onOpenChange={(next) => {
						setOpen(next);
						if (!next) setQuery("");
					}}
				>
					<PopoverTrigger asChild>
						<Button type="button" variant="ghost" size="icon-xs">
							<PlusIcon />
							<span className="sr-only">Link document</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-72 p-2">
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search documents…"
						/>
						<div className="mt-2 max-h-56 overflow-y-auto">
							{available.length === 0 ? (
								<p className="px-2 py-3 text-xs text-muted-foreground">
									No documents to link
								</p>
							) : (
								available.map((document) => (
									<button
										key={document.id}
										type="button"
										className="flex w-full items-start rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
										onClick={() =>
											void handleLink(
												document.id,
												document.title,
												document.updatedAt,
											)
										}
									>
										<span className="line-clamp-2 font-medium">
											{document.title}
										</span>
									</button>
								))
							)}
						</div>
					</PopoverContent>
				</Popover>
			</div>
			{linkedDocuments.length === 0 ? (
				<p className="text-xs text-muted-foreground">No linked documents</p>
			) : (
				<ul className="flex flex-col gap-1">
					{linkedDocuments.map((document) => (
						<li
							key={document.id}
							className="group flex items-start gap-1 rounded-md px-1 py-1 hover:bg-accent"
						>
							<Link
								to="/workspaces/$code/documents/$documentId"
								params={{ code: workspaceCode, documentId: document.id }}
								className="min-w-0 flex-1 line-clamp-2 text-sm font-medium"
							>
								{document.title}
							</Link>
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								className="opacity-0 group-hover:opacity-100"
								onClick={() => void handleUnlink(document.id)}
							>
								<XIcon />
								<span className="sr-only">Unlink document</span>
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
