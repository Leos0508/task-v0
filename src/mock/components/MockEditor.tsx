import {
	BoldIcon,
	Heading2Icon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	UnderlineIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

export default function MockEditor({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("min-h-64 min-w-0 w-full", className)}>
			<div className="mb-3 flex flex-wrap items-center gap-0.5 border-b pb-2 text-muted-foreground">
				<Button
					type="button"
					size="icon-xs"
					variant="ghost"
					disabled
					aria-label="Heading"
				>
					<Heading2Icon />
				</Button>
				<Button
					type="button"
					size="icon-xs"
					variant="ghost"
					disabled
					aria-label="Bold"
				>
					<BoldIcon />
				</Button>
				<Button
					type="button"
					size="icon-xs"
					variant="ghost"
					disabled
					aria-label="Italic"
				>
					<ItalicIcon />
				</Button>
				<Button
					type="button"
					size="icon-xs"
					variant="ghost"
					disabled
					aria-label="Underline"
				>
					<UnderlineIcon />
				</Button>
				<Button
					type="button"
					size="icon-xs"
					variant="ghost"
					disabled
					aria-label="Bulleted list"
				>
					<ListIcon />
				</Button>
				<Button
					type="button"
					size="icon-xs"
					variant="ghost"
					disabled
					aria-label="Numbered list"
				>
					<ListOrderedIcon />
				</Button>
				<Button
					type="button"
					size="icon-xs"
					variant="ghost"
					disabled
					aria-label="Link"
					className="ml-auto"
				>
					<LinkIcon />
				</Button>
			</div>
			<div className="tiptap-editor">{children}</div>
		</div>
	);
}
