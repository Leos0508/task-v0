import type { Editor } from "@tiptap/core";
import { toast } from "sonner";

function toHttpHref(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const href = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)
		? trimmed
		: `https://${trimmed}`;
	try {
		const url = new URL(href);
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}
		return url.toString();
	} catch {
		return null;
	}
}

export function promptEditorLink(editor: Editor) {
	const previous = String(editor.getAttributes("link").href ?? "");
	const next = window.prompt("Link URL", previous);
	if (next === null) return;

	const trimmed = next.trim();
	if (trimmed === "") {
		editor.chain().focus().extendMarkRange("link").unsetLink().run();
		return;
	}

	const href = toHttpHref(trimmed);
	if (!href) {
		toast.error("Only http and https links are allowed");
		return;
	}

	editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
}
