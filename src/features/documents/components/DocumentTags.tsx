import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { documentKeys } from "#/features/documents/queries";
import IssueTagBadge from "#/features/issues/components/IssueTagBadge";
import {
	issueKeys,
	tagKeys,
	tagsQueryOptions,
} from "#/features/issues/queries";
import { TAG_NAME_MAX } from "#/features/issues/schema";
import {
	getRandomTagColorId,
	TAG_COLORS,
	type TagColorId,
} from "#/features/issues/tag-colors";
import type { IssueTag } from "#/lib/data/fetch-tags";
import {
	createTagFn,
	deleteTagFn,
	linkTagToDocumentFn,
	unlinkTagFromDocumentFn,
} from "#/lib/functions/tags.functions";
import { cn } from "#/lib/utils";

type DocumentTagsProps = {
	workspaceCode: string;
	documentId: string;
	tags: IssueTag[];
	canManageTags: boolean;
	onTagsChange: (tags: IssueTag[]) => void;
};

export default function DocumentTags({
	workspaceCode,
	documentId,
	tags,
	canManageTags,
	onTagsChange,
}: DocumentTagsProps) {
	const queryClient = useQueryClient();
	const { data: catalog = [] } = useQuery(tagsQueryOptions(workspaceCode));
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [color, setColor] = useState<TagColorId>(getRandomTagColorId);

	const linkedIds = useMemo(() => new Set(tags.map((tag) => tag.id)), [tags]);
	const needle = query.trim();

	const available = useMemo(() => {
		const lower = needle.toLowerCase();
		return catalog.filter((tag) => {
			if (linkedIds.has(tag.id)) return false;
			if (!lower) return true;
			return tag.name.toLowerCase().includes(lower);
		});
	}, [catalog, linkedIds, needle]);

	const canCreate =
		needle.length > 0 &&
		needle.length <= TAG_NAME_MAX &&
		!catalog.some((tag) => tag.name.toLowerCase() === needle.toLowerCase());

	async function invalidate() {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: tagKeys.all(workspaceCode),
			}),
			queryClient.invalidateQueries({
				queryKey: documentKeys.all(workspaceCode),
			}),
			queryClient.invalidateQueries({
				queryKey: issueKeys.all(workspaceCode),
			}),
		]);
	}

	async function handleLink(next: IssueTag) {
		const result = await linkTagToDocumentFn({
			data: {
				workspaceCode,
				documentId,
				tagId: next.id,
			},
		});
		if (!result.success || result.data == null) {
			toast.error(result.success ? "Failed to add tag" : result.error.message);
			return;
		}

		onTagsChange(
			[...tags, result.data].sort((a, b) => a.name.localeCompare(b.name)),
		);
		setOpen(false);
		setQuery("");
		await invalidate();
	}

	async function handleUnlink(tagId: string) {
		const result = await unlinkTagFromDocumentFn({
			data: {
				workspaceCode,
				documentId,
				tagId,
			},
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}

		onTagsChange(tags.filter((tag) => tag.id !== tagId));
		await invalidate();
	}

	async function handleCreate() {
		const created = await createTagFn({
			data: {
				workspaceCode,
				input: { name: needle, color },
			},
		});
		if (!created.success || created.data == null) {
			toast.error(
				created.success ? "Failed to create tag" : created.error.message,
			);
			return;
		}

		setColor(getRandomTagColorId());
		await handleLink(created.data);
	}

	async function handleDelete(tagId: string) {
		const result = await deleteTagFn({
			data: { workspaceCode, tagId },
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}

		onTagsChange(tags.filter((tag) => tag.id !== tagId));
		await invalidate();
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<p className="text-xs text-muted-foreground">Tags</p>
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
							<span className="sr-only">Add tag</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-72 p-2">
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search or create tag…"
							maxLength={TAG_NAME_MAX}
						/>
						<div className="mt-2 max-h-56 overflow-y-auto">
							{available.length === 0 && !canCreate ? (
								<p className="px-2 py-3 text-xs text-muted-foreground">
									No tags to add
								</p>
							) : (
								available.map((tag) => (
									<div
										key={tag.id}
										className="flex items-center gap-1 rounded-md hover:bg-accent"
									>
										<button
											type="button"
											className="flex min-w-0 flex-1 items-center px-2 py-1.5 text-left"
											onClick={() => void handleLink(tag)}
										>
											<IssueTagBadge tag={tag} tone="accent" />
										</button>
										{canManageTags ? (
											<Button
												type="button"
												variant="ghost"
												size="icon-xs"
												onClick={() => void handleDelete(tag.id)}
											>
												<Trash2Icon />
												<span className="sr-only">Delete tag</span>
											</Button>
										) : null}
									</div>
								))
							)}
							{canCreate ? (
								<div className="mt-1 flex flex-col gap-2 border-t px-2 pt-2">
									<div className="flex flex-wrap gap-1.5">
										{TAG_COLORS.map((option) => {
											const selected = option.id === color;
											return (
												<button
													key={option.id}
													type="button"
													aria-label={option.id}
													aria-pressed={selected}
													className={cn(
														"size-4 rounded-full ring-offset-2 ring-offset-popover",
														selected && "ring-2 ring-ring",
													)}
													style={{ backgroundColor: option.hex }}
													onClick={() => setColor(option.id)}
												/>
											);
										})}
									</div>
									<button
										type="button"
										className="rounded-md px-1 py-1.5 text-left text-sm hover:bg-accent"
										onClick={() => void handleCreate()}
									>
										Create “{needle}”
									</button>
								</div>
							) : null}
						</div>
					</PopoverContent>
				</Popover>
			</div>
			{tags.length === 0 ? (
				<p className="text-xs text-muted-foreground">No tags</p>
			) : (
				<ul className="flex flex-wrap gap-1">
					{tags.map((tag) => (
						<li key={tag.id}>
							<IssueTagBadge
								tag={tag}
								onRemove={() => void handleUnlink(tag.id)}
							/>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
