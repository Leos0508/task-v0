import { Badge } from "#/components/ui/badge";
import type { IssueTag } from "#/lib/data/fetch-tags";
import { cn } from "#/lib/utils";
import { type MockTagTone, mockTags } from "#/mock/fixtures";

const toneClass: Record<MockTagTone, string> = {
	product: "mock-tag-product border-transparent",
	editor: "mock-tag-editor border-transparent",
	v0: "mock-tag-v0 border-transparent",
	writing: "mock-tag-writing border-transparent",
};

function toneFor(tag: IssueTag): MockTagTone {
	const known = mockTags.find(
		(item) => item.id === tag.id || item.name === tag.name,
	);
	return known?.tone ?? "product";
}

export default function MockTagBadge({
	tag,
	className,
}: {
	tag: IssueTag;
	className?: string;
}) {
	return (
		<Badge
			variant="outline"
			className={cn("font-normal", toneClass[toneFor(tag)], className)}
		>
			{tag.name}
		</Badge>
	);
}
