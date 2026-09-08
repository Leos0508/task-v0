import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import {
	BetweenHorizontalEndIcon,
	BetweenHorizontalStartIcon,
	BetweenVerticalEndIcon,
	BetweenVerticalStartIcon,
	HeadingIcon,
	Trash2Icon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";

function TableToolbarButton({
	label,
	onClick,
	destructive = false,
	children,
}: {
	label: string;
	onClick: () => void;
	destructive?: boolean;
	children: ReactNode;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					size="icon-xs"
					variant="ghost"
					aria-label={label}
					className={
						destructive
							? "text-destructive hover:bg-destructive/10 hover:text-destructive"
							: undefined
					}
					onMouseDown={(event) => event.preventDefault()}
					onClick={onClick}
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
}

function getTableVirtualElement(editor: Editor) {
	return () => {
		const { view, state } = editor;
		const $pos = state.selection.$from;
		for (let depth = $pos.depth; depth > 0; depth -= 1) {
			if ($pos.node(depth).type.name !== "table") continue;
			const dom = view.nodeDOM($pos.before(depth));
			if (!(dom instanceof HTMLElement)) return null;
			return {
				getBoundingClientRect: () => dom.getBoundingClientRect(),
			};
		}
		return null;
	};
}

export default function TableToolbar({ editor }: { editor: Editor }) {
	return (
		<BubbleMenu
			editor={editor}
			pluginKey="tableToolbar"
			updateDelay={0}
			shouldShow={({ editor: current }) =>
				current.isEditable && current.isActive("table")
			}
			getReferencedVirtualElement={getTableVirtualElement(editor)}
			options={{ placement: "top", offset: 8 }}
			className="z-50 flex items-center gap-0.5 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
		>
			<TooltipProvider delayDuration={300}>
				<TableToolbarButton
					label="Add row above"
					onClick={() => editor.chain().focus().addRowBefore().run()}
				>
					<BetweenHorizontalStartIcon />
				</TableToolbarButton>
				<TableToolbarButton
					label="Add row below"
					onClick={() => editor.chain().focus().addRowAfter().run()}
				>
					<BetweenHorizontalEndIcon />
				</TableToolbarButton>
				<TableToolbarButton
					label="Delete row"
					onClick={() => editor.chain().focus().deleteRow().run()}
				>
					<Trash2Icon />
				</TableToolbarButton>
				<Separator
					orientation="vertical"
					className="mx-0.5 data-[orientation=vertical]:h-4"
				/>
				<TableToolbarButton
					label="Add column left"
					onClick={() => editor.chain().focus().addColumnBefore().run()}
				>
					<BetweenVerticalStartIcon />
				</TableToolbarButton>
				<TableToolbarButton
					label="Add column right"
					onClick={() => editor.chain().focus().addColumnAfter().run()}
				>
					<BetweenVerticalEndIcon />
				</TableToolbarButton>
				<TableToolbarButton
					label="Delete column"
					onClick={() => editor.chain().focus().deleteColumn().run()}
				>
					<Trash2Icon />
				</TableToolbarButton>
				<Separator
					orientation="vertical"
					className="mx-0.5 data-[orientation=vertical]:h-4"
				/>
				<TableToolbarButton
					label="Toggle header row"
					onClick={() => editor.chain().focus().toggleHeaderRow().run()}
				>
					<HeadingIcon />
				</TableToolbarButton>
				<TableToolbarButton
					label="Delete table"
					destructive
					onClick={() => editor.chain().focus().deleteTable().run()}
				>
					<Trash2Icon />
				</TableToolbarButton>
			</TooltipProvider>
		</BubbleMenu>
	);
}
