import type { Editor } from "@tiptap/core";
import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
	assertDescriptionImage,
	DESCRIPTION_IMAGE_ACCEPT,
	DESCRIPTION_IMAGE_MIME_TYPES,
} from "#/lib/description-image";
import { promptEditorLink } from "./editor-link";
import { EditorUnderline } from "./editor-underline";
import { MarkdownClipboard } from "./markdown-clipboard";
import { Mermaid } from "./mermaid-extension";
import { SlashCommand } from "./slash-command";
import TableToolbar from "./TableToolbar";

type IssueEditorProps = {
	value: unknown;
	onChange: (value: unknown) => void;
	placeholder?: string;
	mode?: "edit" | "readonly";
	onUploadImage?: (file: File) => Promise<{ src: string }>;
};

const emptyDoc = {
	type: "doc",
	content: [{ type: "paragraph" }],
};

const EditorLink = Link.extend({
	addKeyboardShortcuts() {
		return {
			...this.parent?.(),
			"Mod-k": () => {
				promptEditorLink(this.editor);
				return true;
			},
		};
	},
}).configure({
	autolink: true,
	markdownLinks: true,
	defaultProtocol: "https",
	openOnClick: true,
	protocols: ["http", "https"],
	HTMLAttributes: {
		rel: "noopener noreferrer",
		target: "_blank",
	},
	isAllowedUri: (url, ctx) => {
		if (!ctx.defaultValidate(url)) return false;
		try {
			const parsed = new URL(
				url.includes(":") ? url : `${ctx.defaultProtocol}://${url}`,
			);
			return parsed.protocol === "http:" || parsed.protocol === "https:";
		} catch {
			return false;
		}
	},
});

async function insertUploadedImages({
	editor,
	files,
	upload,
	editable,
	pos,
}: {
	editor: Editor;
	files: File[];
	upload: ((file: File) => Promise<{ src: string }>) | undefined;
	editable: boolean;
	pos?: number;
}) {
	if (!editable || !upload) return;

	let nextPos = pos;
	for (const file of files) {
		try {
			assertDescriptionImage(file);
			const { src } = await upload(file);
			const attrs = { src, alt: file.name };
			if (nextPos == null) {
				editor.chain().focus().setImage(attrs).run();
			} else {
				editor.chain().insertContentAt(nextPos, { type: "image", attrs }).run();
				nextPos += 1;
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to upload image",
			);
		}
	}
}

export default function IssueEditor({
	value,
	onChange,
	placeholder = "Describe the issue… Type / for commands",
	mode = "edit",
	onUploadImage,
}: IssueEditorProps) {
	const onChangeRef = useRef(onChange);
	const onUploadImageRef = useRef(onUploadImage);
	const lastEmitted = useRef(JSON.stringify(value ?? emptyDoc));
	const fileInputRef = useRef<HTMLInputElement>(null);
	const isEditable = mode === "edit";
	const isEditableRef = useRef(isEditable);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		onUploadImageRef.current = onUploadImage;
	}, [onUploadImage]);

	useEffect(() => {
		isEditableRef.current = isEditable;
	}, [isEditable]);

	const editor = useEditor({
		immediatelyRender: false,
		editable: isEditable,
		extensions: [
			StarterKit.configure({
				link: false,
				underline: false,
			}),
			Placeholder.configure({ placeholder }),
			Image.configure({ allowBase64: false }),
			EditorLink,
			EditorUnderline,
			TableKit.configure({
				table: { resizable: false },
			}),
			Mermaid,
			MarkdownClipboard,
			SlashCommand.configure({
				getPickImage: () =>
					onUploadImageRef.current
						? () => fileInputRef.current?.click()
						: undefined,
			}),
			FileHandler.configure({
				allowedMimeTypes: [...DESCRIPTION_IMAGE_MIME_TYPES],
				consumePasteEvent: true,
				onDrop: (currentEditor, files, pos) => {
					void insertUploadedImages({
						editor: currentEditor,
						files,
						upload: onUploadImageRef.current,
						editable: isEditableRef.current,
						pos,
					});
				},
				onPaste: (currentEditor, files) => {
					void insertUploadedImages({
						editor: currentEditor,
						files,
						upload: onUploadImageRef.current,
						editable: isEditableRef.current,
					});
				},
			}),
		],
		content: (value as object | undefined) ?? emptyDoc,
		onUpdate: ({ editor: instance }) => {
			const json = instance.getJSON();
			lastEmitted.current = JSON.stringify(json);
			onChangeRef.current(json);
		},
		editorProps: {
			attributes: {
				class: "tiptap-editor",
			},
		},
	});

	useEffect(() => {
		if (!editor) return;
		editor.setEditable(isEditable);
	}, [editor, isEditable]);

	useEffect(() => {
		if (!editor || value == null) return;
		const next = JSON.stringify(value);
		if (next === lastEmitted.current) return;
		lastEmitted.current = next;
		editor.commands.setContent(value as object, { emitUpdate: false });
	}, [editor, value]);

	if (!editor) {
		return (
			<div className="tiptap-editor text-sm text-muted-foreground">
				<span className="sr-only">Loading editor</span>
			</div>
		);
	}

	const showPicker = isEditable && Boolean(onUploadImage);

	return (
		<div className="min-w-0">
			{showPicker ? (
				<input
					ref={fileInputRef}
					type="file"
					accept={DESCRIPTION_IMAGE_ACCEPT}
					multiple
					aria-label="Upload image"
					className="sr-only"
					onChange={(event) => {
						const files = Array.from(event.target.files ?? []);
						event.target.value = "";
						if (files.length === 0) return;
						void insertUploadedImages({
							editor,
							files,
							upload: onUploadImageRef.current,
							editable: isEditableRef.current,
						});
					}}
				/>
			) : null}
			<TableToolbar editor={editor} />
			<EditorContent editor={editor} />
		</div>
	);
}
