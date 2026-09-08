import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
	looksLikeGfmTable,
	looksLikeMarkdownBlocks,
	markdownToTipTap,
} from "#/mcp/markdown";

function asInsertableContent(value: unknown) {
	if (
		typeof value !== "object" ||
		value === null ||
		!("content" in value) ||
		!Array.isArray(value.content)
	) {
		return null;
	}
	return value.content as object[];
}

export const MarkdownClipboard = Extension.create({
	name: "markdownClipboard",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("markdownClipboard"),
				props: {
					handlePaste: (_view, event) => {
						if (!this.editor.isEditable) return false;
						if (this.editor.isActive("codeBlock")) return false;
						if (this.editor.isActive("mermaid")) return false;

						const text = event.clipboardData?.getData("text/plain") ?? "";
						if (!looksLikeMarkdownBlocks(text)) return false;

						const content = asInsertableContent(markdownToTipTap(text));
						if (!content?.length) return false;

						event.preventDefault();
						this.editor.chain().focus().insertContent(content).run();
						return true;
					},
					handleKeyDown: (view, event) => {
						if (event.key !== "Enter" || event.shiftKey) return false;
						if (!this.editor.isEditable) return false;
						if (this.editor.isActive("table")) return false;
						if (this.editor.isActive("codeBlock")) return false;

						const { selection } = view.state;
						const { $from } = selection;
						if ($from.depth !== 1) return false;
						if ($from.parent.type.name !== "paragraph") return false;
						if ($from.parentOffset !== $from.parent.content.size) return false;

						const index = $from.index(0);
						if (index === 0) return false;
						const previous = view.state.doc.child(index - 1);
						if (previous.type.name !== "paragraph") return false;

						const markdown = `${previous.textContent}\n${$from.parent.textContent}`;
						if (!looksLikeGfmTable(markdown)) return false;

						const content = asInsertableContent(markdownToTipTap(markdown));
						const table = content?.find(
							(node) =>
								typeof node === "object" &&
								node !== null &&
								"type" in node &&
								node.type === "table",
						);
						if (!table) return false;

						const from = $from.before(1) - previous.nodeSize;
						const to = $from.after(1);
						this.editor
							.chain()
							.focus()
							.deleteRange({ from, to })
							.insertContentAt(from, table)
							.run();
						return true;
					},
				},
			}),
		];
	},
});
