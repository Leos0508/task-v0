import { XIcon } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { resolveTagColor } from "#/features/issues/tag-colors";
import type { IssueTag } from "#/lib/data/fetch-tags";
import { cn } from "#/lib/utils";

export default function IssueTagBadge({
	tag,
	className,
	onRemove,
	tone = "secondary",
}: {
	tag: IssueTag;
	className?: string;
	onRemove?: () => void;
	tone?: "secondary" | "accent";
}) {
	const color = resolveTagColor(tag.color);

	return (
		<Badge
			variant="outline"
			style={
				tone === "accent"
					? undefined
					: { backgroundColor: color.bg, color: color.fg }
			}
			className={cn(
				"max-w-full min-w-0 shrink rounded-full border-transparent font-normal",
				tone === "accent" &&
					"border-transparent bg-accent text-accent-foreground",
				onRemove && "pr-0.5",
				className,
			)}
		>
			<span className="truncate">{tag.name}</span>
			{onRemove ? (
				<button
					type="button"
					className="rounded-full p-0.5 hover:bg-foreground/10"
					onClick={onRemove}
				>
					<XIcon className="size-3" />
					<span className="sr-only">Remove {tag.name}</span>
				</button>
			) : null}
		</Badge>
	);
}
