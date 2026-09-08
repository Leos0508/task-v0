import { type Editor, Extension, type Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
	type SuggestionKeyDownProps,
	type SuggestionOptions,
	type SuggestionProps,
} from "@tiptap/suggestion";
import {
	BoldIcon,
	CodeIcon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	Heading4Icon,
	Heading5Icon,
	Heading6Icon,
	ImageIcon,
	ItalicIcon,
	ListIcon,
	ListOrderedIcon,
	MinusIcon,
	SquareCodeIcon,
	StrikethroughIcon,
	TextQuoteIcon,
	TypeIcon,
} from "lucide-react";
import {
	type SlashCommandItem,
	SlashCommandList,
	type SlashCommandListProps,
	scrollOptionIntoMenu,
} from "./SlashCommandList";

type SlashCommandOptions = {
	getPickImage?: () => (() => void) | undefined;
	suggestion: Omit<
		SuggestionOptions<SlashCommandItem, SlashCommandItem>,
		"editor"
	>;
};

const headingIcons = {
	1: Heading1Icon,
	2: Heading2Icon,
	3: Heading3Icon,
	4: Heading4Icon,
	5: Heading5Icon,
	6: Heading6Icon,
} as const;

function matchesQuery(item: SlashCommandItem, query: string) {
	const needle = query.trim().toLowerCase();
	if (needle.length === 0) return true;
	return [item.title, item.id, ...item.keywords].some((value) =>
		value.toLowerCase().includes(needle),
	);
}

function chainFrom(editor: Editor, range: Range) {
	return editor.chain().focus().deleteRange(range);
}

export function getSlashCommandItems({
	query,
	onPickImage,
}: {
	query: string;
	onPickImage?: () => void;
}): SlashCommandItem[] {
	const items: SlashCommandItem[] = [
		{
			id: "paragraph",
			title: "Text",
			keywords: ["p", "paragraph", "plain", "body"],
			group: "Headings",
			icon: TypeIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).setParagraph().run();
			},
		},
		...([1, 2, 3, 4, 5, 6] as const).map((level) => ({
			id: `heading-${level}`,
			title: `Heading ${level}`,
			keywords: ["h", `h${level}`, "heading", "title"],
			group: "Headings",
			icon: headingIcons[level],
			command: ({ editor, range }: { editor: Editor; range: Range }) => {
				chainFrom(editor, range).toggleHeading({ level }).run();
			},
		})),
		{
			id: "bullet-list",
			title: "Bullet list",
			keywords: ["ul", "list", "unordered", "bullets"],
			group: "Lists",
			icon: ListIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).toggleBulletList().run();
			},
		},
		{
			id: "ordered-list",
			title: "Numbered list",
			keywords: ["ol", "list", "ordered", "numbers"],
			group: "Lists",
			icon: ListOrderedIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).toggleOrderedList().run();
			},
		},
		{
			id: "bold",
			title: "Bold",
			keywords: ["strong", "bold", "format"],
			group: "Format",
			icon: BoldIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).toggleBold().run();
			},
		},
		{
			id: "italic",
			title: "Italic",
			keywords: ["em", "italic", "emphasis", "format"],
			group: "Format",
			icon: ItalicIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).toggleItalic().run();
			},
		},
		{
			id: "strike",
			title: "Strikethrough",
			keywords: ["strike", "strikethrough", "deleted", "format"],
			group: "Format",
			icon: StrikethroughIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).toggleStrike().run();
			},
		},
		{
			id: "inline-code",
			title: "Inline code",
			keywords: ["code", "monospace", "inline", "format"],
			group: "Format",
			icon: CodeIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).toggleCode().run();
			},
		},
		{
			id: "blockquote",
			title: "Quote",
			keywords: ["quote", "blockquote", "citation"],
			group: "Blocks",
			icon: TextQuoteIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).toggleBlockquote().run();
			},
		},
		{
			id: "code-block",
			title: "Code block",
			keywords: ["code", "pre", "snippet", "block"],
			group: "Blocks",
			icon: SquareCodeIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).toggleCodeBlock().run();
			},
		},
		{
			id: "divider",
			title: "Divider",
			keywords: ["hr", "horizontal", "rule", "line", "separator"],
			group: "Blocks",
			icon: MinusIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).setHorizontalRule().run();
			},
		},
	];

	if (onPickImage) {
		items.push({
			id: "image",
			title: "Image",
			keywords: ["image", "upload", "picture", "photo"],
			group: "Blocks",
			icon: ImageIcon,
			command: ({ editor, range }) => {
				chainFrom(editor, range).run();
				onPickImage();
			},
		});
	}

	return items.filter((item) => matchesQuery(item, query));
}

function renderSlashCommandList() {
	let component: ReactRenderer<unknown, SlashCommandListProps> | null = null;
	let unmount: (() => void) | null = null;
	let selectedIndex = 0;
	let items: SlashCommandItem[] = [];
	let command: (item: SlashCommandItem) => void = () => {};
	let onDomKeyDown: ((event: KeyboardEvent) => void) | null = null;

	const scrollSelectedIntoMenu = () => {
		const root = component?.element;
		if (!root) return;
		const container =
			root.querySelector<HTMLElement>('[role="listbox"]') ?? root;
		const option = root.querySelector<HTMLElement>(
			`[data-slash-index="${selectedIndex}"]`,
		);
		scrollOptionIntoMenu(container, option);
	};

	const renderMenu = () => {
		if (selectedIndex > items.length - 1) {
			selectedIndex = Math.max(0, items.length - 1);
		}
		component?.updateProps({
			items,
			command,
			selectedIndex,
			onSelectedIndexChange,
		});
		scrollSelectedIntoMenu();
		requestAnimationFrame(scrollSelectedIntoMenu);
	};

	const onSelectedIndexChange = (index: number) => {
		selectedIndex = index;
		renderMenu();
	};

	const handleMenuKey = (event: KeyboardEvent) => {
		if (items.length === 0) {
			return event.key === "Enter";
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			event.stopPropagation();
			selectedIndex = Math.max(0, selectedIndex - 1);
			renderMenu();
			return true;
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			event.stopPropagation();
			selectedIndex = Math.min(items.length - 1, selectedIndex + 1);
			renderMenu();
			return true;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			event.stopPropagation();
			const item = items[selectedIndex];
			if (item) {
				command(item);
			}
			return true;
		}

		return false;
	};

	return {
		onStart(props: SuggestionProps<SlashCommandItem, SlashCommandItem>) {
			items = props.items;
			command = props.command;
			selectedIndex = 0;
			component = new ReactRenderer(SlashCommandList, {
				editor: props.editor,
				props: {
					items,
					command,
					selectedIndex,
					onSelectedIndexChange,
				},
				className: "z-50 max-h-[min(28rem,70vh)] overflow-y-auto",
			});
			unmount = props.mount(component.element);
			onDomKeyDown = (event) => {
				handleMenuKey(event);
			};
			document.addEventListener("keydown", onDomKeyDown, true);
		},
		onUpdate(props: SuggestionProps<SlashCommandItem, SlashCommandItem>) {
			items = props.items;
			command = props.command;
			renderMenu();
		},
		onKeyDown(props: SuggestionKeyDownProps) {
			if (props.event.defaultPrevented) {
				return true;
			}
			return handleMenuKey(props.event);
		},
		onExit() {
			if (onDomKeyDown) {
				document.removeEventListener("keydown", onDomKeyDown, true);
				onDomKeyDown = null;
			}
			unmount?.();
			component?.destroy();
			component = null;
			unmount = null;
			items = [];
			selectedIndex = 0;
		},
	};
}

export const slashCommandPluginKey = new PluginKey("slashCommand");

export const SlashCommand = Extension.create<SlashCommandOptions>({
	name: "slashCommand",

	addOptions() {
		return {
			getPickImage: undefined,
			suggestion: {
				char: "/",
				pluginKey: slashCommandPluginKey,
				command: ({ editor, range, props }) => {
					props.command({ editor, range });
				},
			},
		};
	},

	addProseMirrorPlugins() {
		return [
			Suggestion({
				editor: this.editor,
				...this.options.suggestion,
				allow: ({ editor }) => editor.isEditable,
				items: ({ query }) =>
					getSlashCommandItems({
						query,
						onPickImage: this.options.getPickImage?.(),
					}),
				render: renderSlashCommandList,
				floatingUi: {
					strategy: "fixed",
				},
			}),
		];
	},
});
