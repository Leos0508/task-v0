import type { ReactNode } from "react";
import { Badge } from "#/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import IssueTagBadge from "#/features/issues/components/IssueTagBadge";
import type { IssueTag } from "#/lib/data/fetch-tags";

const VISIBLE_TAG_LIMIT = 2;

export default function IssueListTags({
	tags,
	empty = <span className="text-muted-foreground">—</span>,
	renderTag = defaultRenderTag,
}: {
	tags: IssueTag[];
	empty?: ReactNode;
	renderTag?: (tag: IssueTag) => ReactNode;
}) {
	if (tags.length === 0) {
		return empty;
	}

	if (tags.length <= VISIBLE_TAG_LIMIT) {
		return (
			<div className="flex min-w-0 max-w-full flex-wrap gap-1">
				{tags.map((tag) => (
					<span key={tag.id} className="min-w-0 max-w-full">
						{renderTag(tag)}
					</span>
				))}
			</div>
		);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					aria-label={`Show all ${tags.length} tags`}
					onPointerDown={(event) => event.stopPropagation()}
				>
					<Badge variant="secondary">+{tags.length}</Badge>
				</button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto max-w-64 p-2">
				<ul className="flex max-w-full min-w-0 flex-wrap gap-1">
					{tags.map((tag) => (
						<li key={tag.id} className="min-w-0 max-w-full list-none">
							{renderTag(tag)}
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}

function defaultRenderTag(tag: IssueTag) {
	return <IssueTagBadge tag={tag} />;
}
