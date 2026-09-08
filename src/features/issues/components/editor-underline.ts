import { markInputRule, markPasteRule } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";

export const EditorUnderline = Underline.extend({
	addInputRules() {
		return [
			markInputRule({
				find: /(?<![A-Za-z0-9])\+\+([^+]+)\+\+$/,
				type: this.type,
			}),
			markInputRule({
				find: /<u>([^<]+)<\/u>$/,
				type: this.type,
			}),
		];
	},

	addPasteRules() {
		return [
			markPasteRule({
				find: /(?<![A-Za-z0-9])\+\+([^+]+)\+\+/g,
				type: this.type,
			}),
			markPasteRule({
				find: /<u>([^<]+)<\/u>/g,
				type: this.type,
			}),
		];
	},
});
