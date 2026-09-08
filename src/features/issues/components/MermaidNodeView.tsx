import {
	NodeViewContent,
	type NodeViewProps,
	NodeViewWrapper,
} from "@tiptap/react";
import { CodeIcon, EyeIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

export default function MermaidNodeView({
	node,
	editor,
	getPos,
	updateAttributes,
}: NodeViewProps) {
	const source = node.textContent;
	const renderId = `mermaid-${useId().replace(/:/g, "")}`;
	const previewRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [hasPreview, setHasPreview] = useState(false);
	const editable = editor.isEditable;
	const showSource = editable && Boolean(node.attrs.editing);

	useEffect(() => {
		let cancelled = false;
		const code = source.trim();
		const target = previewRef.current;
		if (!code) {
			if (target) target.replaceChildren();
			setHasPreview(false);
			setError(null);
			return;
		}

		const timeout = window.setTimeout(() => {
			void import("mermaid")
				.then(async (mod) => {
					const mermaid = mod.default;
					mermaid.initialize({
						startOnLoad: false,
						securityLevel: "strict",
						theme: "neutral",
					});
					const result = await mermaid.render(
						`${renderId}-${Date.now()}`,
						code,
					);
					if (cancelled) return;
					const container = previewRef.current;
					if (!container) return;
					container.replaceChildren();
					const parsed = new DOMParser().parseFromString(
						result.svg,
						"image/svg+xml",
					);
					const svg = parsed.documentElement;
					if (svg instanceof SVGSVGElement) {
						container.append(svg);
						setHasPreview(true);
						setError(null);
					} else {
						setHasPreview(false);
						setError("Invalid diagram");
					}
				})
				.catch((caught: unknown) => {
					if (cancelled) return;
					previewRef.current?.replaceChildren();
					setHasPreview(false);
					setError(
						caught instanceof Error ? caught.message : "Invalid diagram",
					);
				});
		}, 250);

		return () => {
			cancelled = true;
			window.clearTimeout(timeout);
		};
	}, [renderId, source]);

	const toggleMode = () => {
		const nextEditing = !showSource;
		updateAttributes({ editing: nextEditing });
		const pos = getPos();
		if (typeof pos !== "number") return;
		if (nextEditing) {
			editor
				.chain()
				.focus()
				.setTextSelection(pos + 1)
				.run();
			return;
		}
		editor.chain().focus().setNodeSelection(pos).run();
	};

	return (
		<NodeViewWrapper className="mermaid-node" data-type="mermaid">
			{editable ? (
				<div className="mermaid-controls" contentEditable={false}>
					<Button
						type="button"
						size="xs"
						variant="ghost"
						onMouseDown={(event) => event.preventDefault()}
						onClick={toggleMode}
					>
						{showSource ? <EyeIcon /> : <CodeIcon />}
						{showSource ? "Preview" : "Edit source"}
					</Button>
				</div>
			) : null}
			<div className={cn("mermaid-preview", showSource && "hidden")}>
				<div
					ref={previewRef}
					className="mermaid-svg"
					aria-hidden={!hasPreview}
				/>
				{error ? (
					<p className="text-sm text-destructive">{error}</p>
				) : hasPreview ? null : (
					<p className="text-sm text-muted-foreground">Diagram preview</p>
				)}
			</div>
			<pre className={cn("mermaid-source", !showSource && "hidden")}>
				<NodeViewContent />
			</pre>
		</NodeViewWrapper>
	);
}
