import type { Editor, Range } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";
import { useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "#/lib/utils";

export type SlashCommandItem = {
	id: string;
	title: string;
	keywords: string[];
	group: string;
	icon: LucideIcon;
	command: (props: { editor: Editor; range: Range }) => void;
};

export type SlashCommandListProps = {
	items: SlashCommandItem[];
	command: (item: SlashCommandItem) => void;
	selectedIndex: number;
	onSelectedIndexChange: (index: number) => void;
};

type SlashCommandGroup = {
	name: string;
	items: SlashCommandItem[];
};

function groupSlashItems(items: SlashCommandItem[]): SlashCommandGroup[] {
	const groups: SlashCommandGroup[] = [];
	for (const item of items) {
		const last = groups.at(-1);
		if (last?.name === item.group) {
			last.items.push(item);
		} else {
			groups.push({ name: item.group, items: [item] });
		}
	}
	return groups;
}

function isVerticallyScrollable(element: HTMLElement) {
	const overflowY = getComputedStyle(element).overflowY;
	return (
		(overflowY === "auto" || overflowY === "scroll") &&
		element.scrollHeight > element.clientHeight + 1
	);
}

function findScrollableAncestor(element: HTMLElement) {
	let current: HTMLElement | null = element;
	while (current) {
		if (isVerticallyScrollable(current)) {
			return current;
		}
		current = current.parentElement;
	}
	return null;
}

export function scrollOptionIntoMenu(
	container: HTMLElement | null,
	option: HTMLElement | null,
) {
	if (!option) return;
	const scroller =
		(container && isVerticallyScrollable(container) ? container : null) ??
		findScrollableAncestor(option);
	if (!scroller) return;

	const menu = scroller.getBoundingClientRect();
	const item = option.getBoundingClientRect();
	const padding = 8;
	if (item.bottom > menu.bottom - padding) {
		scroller.scrollTop += item.bottom - (menu.bottom - padding);
	} else if (item.top < menu.top + padding) {
		scroller.scrollTop -= menu.top + padding - item.top;
	}
}

export function SlashCommandList({
	items,
	command,
	selectedIndex,
	onSelectedIndexChange,
}: SlashCommandListProps) {
	const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const listRef = useRef<HTMLDivElement>(null);
	const groups = useMemo(() => groupSlashItems(items), [items]);

	useLayoutEffect(() => {
		scrollOptionIntoMenu(
			listRef.current,
			optionRefs.current[selectedIndex] ?? null,
		);
	}, [selectedIndex]);

	return (
		<div
			ref={listRef}
			className="max-h-[min(28rem,70vh)] min-w-56 max-w-72 overflow-y-auto overscroll-contain rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
			role="listbox"
			aria-label="Editor commands"
		>
			{items.length === 0 ? (
				<p className="px-2 py-1.5 text-sm text-muted-foreground">
					No matching commands
				</p>
			) : (
				groups.map((group) => (
					<div key={group.name} className="py-1">
						<p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
							{group.name}
						</p>
						{group.items.map((item) => {
							const index = items.indexOf(item);
							const selected = index === selectedIndex;
							const Icon = item.icon;
							return (
								<button
									key={item.id}
									ref={(node) => {
										optionRefs.current[index] = node;
									}}
									type="button"
									role="option"
									data-slash-index={index}
									id={`slash-command-${item.id}`}
									aria-selected={selected}
									className={cn(
										"flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden select-none",
										"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
										selected && "bg-accent text-accent-foreground",
									)}
									onMouseDown={(event) => {
										event.preventDefault();
									}}
									onMouseEnter={() => {
										onSelectedIndexChange(index);
									}}
									onClick={() => {
										command(item);
									}}
								>
									<Icon />
									{item.title}
								</button>
							);
						})}
					</div>
				))
			)}
		</div>
	);
}
