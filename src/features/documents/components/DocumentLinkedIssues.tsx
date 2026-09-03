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
import { StatusBadge } from "#/features/issues/components/IssueBadges";
import { issueKeys, issuesQueryOptions } from "#/features/issues/queries";
import type { DocumentLinkedIssue } from "#/lib/data/fetch-document";
import {
	linkIssueToDocumentFn,
	unlinkIssueFromDocumentFn,
} from "#/lib/functions/documents.functions";
import { issueCode } from "#/lib/workspace-path";
import { documentKeys } from "../queries";

type DocumentLinkedIssuesProps = {
	workspaceCode: string;
	documentId: string;
	linkedIssues: DocumentLinkedIssue[];
	onLinkedIssuesChange: (issues: DocumentLinkedIssue[]) => void;
};

export default function DocumentLinkedIssues({
	workspaceCode,
	documentId,
	linkedIssues,
	onLinkedIssuesChange,
}: DocumentLinkedIssuesProps) {
	const queryClient = useQueryClient();
	const { data: issues = [] } = useQuery(issuesQueryOptions(workspaceCode));
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	const linkedIds = useMemo(
		() => new Set(linkedIssues.map((issue) => issue.id)),
		[linkedIssues],
	);

	const available = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return issues.filter((issue) => {
			if (linkedIds.has(issue.id)) return false;
			if (!needle) return true;
			return (
				issue.title.toLowerCase().includes(needle) ||
				String(issue.number).includes(needle)
			);
		});
	}, [issues, linkedIds, query]);

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

	async function handleLink(issueNumber: number) {
		const result = await linkIssueToDocumentFn({
			data: {
				workspaceCode,
				documentId,
				issueNumber,
			},
		});
		if (!result.success || result.data == null) {
			toast.error(
				result.success ? "Failed to link issue" : result.error.message,
			);
			return;
		}

		onLinkedIssuesChange([result.data, ...linkedIssues]);
		setOpen(false);
		setQuery("");
		await invalidate();
	}

	async function handleUnlink(issueNumber: number, issueId: string) {
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

		onLinkedIssuesChange(linkedIssues.filter((issue) => issue.id !== issueId));
		await invalidate();
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<p className="text-xs text-muted-foreground">Linked issues</p>
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
							<span className="sr-only">Link issue</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-72 p-2">
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search issues…"
						/>
						<div className="mt-2 max-h-56 overflow-y-auto">
							{available.length === 0 ? (
								<p className="px-2 py-3 text-xs text-muted-foreground">
									No issues to link
								</p>
							) : (
								available.map((issue) => (
									<button
										key={issue.id}
										type="button"
										className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
										onClick={() => void handleLink(issue.number)}
									>
										<span className="line-clamp-1 font-medium">
											<span className="mr-1 font-mono text-xs text-muted-foreground">
												{issueCode(workspaceCode, issue.number)}
											</span>
											{issue.title}
										</span>
										<StatusBadge status={issue.status} />
									</button>
								))
							)}
						</div>
					</PopoverContent>
				</Popover>
			</div>
			{linkedIssues.length === 0 ? (
				<p className="text-xs text-muted-foreground">No linked issues</p>
			) : (
				<ul className="flex flex-col gap-1">
					{linkedIssues.map((issue) => (
						<li
							key={issue.id}
							className="group flex items-start gap-1 rounded-md px-1 py-1 hover:bg-accent"
						>
							<Link
								to="/app/$code/issues/$issueNumber"
								params={{
									code: workspaceCode,
									issueNumber: String(issue.number),
								}}
								className="min-w-0 flex-1"
							>
								<p className="line-clamp-2 text-sm font-medium">
									<span className="mr-1 font-mono text-xs text-muted-foreground">
										{issueCode(workspaceCode, issue.number)}
									</span>
									{issue.title}
								</p>
							</Link>
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								className="opacity-0 group-hover:opacity-100"
								onClick={() => void handleUnlink(issue.number, issue.id)}
							>
								<XIcon />
								<span className="sr-only">Unlink issue</span>
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
