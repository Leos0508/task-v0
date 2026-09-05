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
			variant={tone === "accent" ? "outline" : "secondary"}
			className={cn(
				tone === "accent" &&
					"border-transparent bg-accent text-accent-foreground",
				onRemove && "pr-0.5",
				className,
			)}
		>
			<span
				aria-hidden
				className="size-2 shrink-0 rounded-full"
				style={{ backgroundColor: color.hex }}
			/>
			{tag.name}
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
