import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

type IssueEditorProps = {
	value: unknown;
	onChange: (value: unknown) => void;
	placeholder?: string;
	mode?: "edit" | "readonly";
};

const emptyDoc = {
	type: "doc",
	content: [{ type: "paragraph" }],
};

export default function IssueEditor({
	value,
	onChange,
	placeholder = "Describe the issue…",
	mode = "edit",
}: IssueEditorProps) {
	const onChangeRef = useRef(onChange);
	const lastEmitted = useRef(JSON.stringify(value ?? emptyDoc));
	const isEditable = mode === "edit";

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	const editor = useEditor({
		immediatelyRender: false,
		editable: isEditable,
		extensions: [StarterKit, Placeholder.configure({ placeholder })],
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
			<div className="min-h-64 py-2 text-sm text-muted-foreground">
				Loading editor…
			</div>
		);
	}

	return <EditorContent editor={editor} />;
}
