import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MermaidNodeView from "./MermaidNodeView";

const DEFAULT_DIAGRAM = "flowchart TD\n  A[Start] --> B[End]";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		mermaid: {
			insertMermaid: (source?: string) => ReturnType;
		};
	}
}

export const Mermaid = Node.create({
	name: "mermaid",
	group: "block",
	code: true,
	defining: true,
	isolating: true,
	content: "text*",

	addAttributes() {
		return {
			editing: {
				default: false,
				rendered: false,
			},
		};
	},

	parseHTML() {
		return [{ tag: 'pre[data-type="mermaid"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"pre",
			mergeAttributes(HTMLAttributes, { "data-type": "mermaid" }),
			["code", 0],
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(MermaidNodeView);
	},

	addCommands() {
		return {
			insertMermaid:
				(source = DEFAULT_DIAGRAM) =>
				({ commands }) =>
					commands.insertContent({
						type: this.name,
						content: [{ type: "text", text: source }],
					}),
		};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("mermaidCodeBlock"),
				appendTransaction: (transactions, _oldState, newState) => {
					if (!transactions.some((transaction) => transaction.docChanged)) {
						return null;
					}

					const mermaidType = newState.schema.nodes[this.name];
					if (!mermaidType) return null;

					const replacements: { pos: number; nodeSize: number }[] = [];
					newState.doc.descendants((node, pos) => {
						if (
							node.type.name === "codeBlock" &&
							node.attrs.language === "mermaid"
						) {
							replacements.push({ pos, nodeSize: node.nodeSize });
						}
					});
					if (replacements.length === 0) return null;

					const { tr } = newState;
					for (let index = replacements.length - 1; index >= 0; index -= 1) {
						const replacement = replacements[index];
						if (!replacement) continue;
						const node = newState.doc.nodeAt(replacement.pos);
						if (!node) continue;
						tr.replaceWith(
							replacement.pos,
							replacement.pos + replacement.nodeSize,
							mermaidType.create(null, node.content),
						);
					}
					return tr;
				},
			}),
		];
	},
});
