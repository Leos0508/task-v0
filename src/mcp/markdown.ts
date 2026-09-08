import { emptyDocumentDescription } from "#/features/documents/schema";
import type { JsonValue } from "#/types/json";

type TipTapMark = {
	type: string;
};

type TipTapNode = {
	type?: string;
	text?: string;
	attrs?: Record<string, unknown>;
	marks?: TipTapMark[];
	content?: TipTapNode[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNode(value: unknown): TipTapNode | null {
	if (!isRecord(value) || typeof value.type !== "string") {
		return null;
	}
	return value as TipTapNode;
}

function applyMarks(text: string, marks: TipTapMark[] | undefined) {
	if (!marks?.length) return text;
	let result = text;
	for (const mark of marks) {
		if (mark.type === "code") {
			result = `\`${result}\``;
		} else if (mark.type === "bold") {
			result = `**${result}**`;
		} else if (mark.type === "italic") {
			result = `*${result}*`;
		} else if (mark.type === "strike") {
			result = `~~${result}~~`;
		}
	}
	return result;
}

function inlineText(nodes: TipTapNode[] | undefined): string {
	if (!nodes?.length) return "";
	return nodes
		.map((node) => {
			if (node.type === "hardBreak") return "\n";
			if (node.type === "text") return applyMarks(node.text ?? "", node.marks);
			return inlineText(node.content);
		})
		.join("");
}

function renderBlock(node: TipTapNode, orderedIndex?: number): string {
	switch (node.type) {
		case "heading": {
			const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6);
			return `${"#".repeat(level)} ${inlineText(node.content)}`;
		}
		case "paragraph":
			return inlineText(node.content);
		case "blockquote":
			return (node.content ?? [])
				.map((child) => renderBlock(child))
				.filter(Boolean)
				.map((line) =>
					line
						.split("\n")
						.map((part) => `> ${part}`)
						.join("\n"),
				)
				.join("\n");
		case "codeBlock":
			return `\`\`\`\n${inlineText(node.content)}\n\`\`\``;
		case "horizontalRule":
			return "---";
		case "bulletList":
			return (node.content ?? [])
				.map(
					(item) =>
						`- ${inlineText(item.content?.[0]?.content ?? item.content)}`,
				)
				.join("\n");
		case "orderedList":
			return (node.content ?? [])
				.map((item, index) => {
					const start = Number(node.attrs?.start ?? 1);
					return `${start + index}. ${inlineText(item.content?.[0]?.content ?? item.content)}`;
				})
				.join("\n");
		case "listItem":
			return `${orderedIndex === undefined ? "-" : `${orderedIndex}.`} ${inlineText(node.content?.[0]?.content ?? node.content)}`;
		case "image": {
			const src = String(node.attrs?.src ?? "");
			const alt = String(node.attrs?.alt ?? "");
			const title = String(node.attrs?.title ?? "");
			if (!src) return "";
			return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
		}
		default:
			return inlineText(node.content);
	}
}

export function tipTapToMarkdown(value: JsonValue | null | undefined): string {
	const root = asNode(value);
	if (!root) return "";
	const blocks = (root.content ?? [])
		.map((node) => renderBlock(node))
		.filter((block) => block.length > 0);
	return blocks.join("\n\n");
}

function parseInline(text: string): TipTapNode[] {
	if (!text) return [];
	const nodes: TipTapNode[] = [];
	const pattern =
		/`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|~~([^~]+)~~|([^*~`]+)/g;
	for (const match of text.matchAll(pattern)) {
		if (match[1] !== undefined) {
			nodes.push({
				type: "text",
				text: match[1],
				marks: [{ type: "code" }],
			});
		} else if (match[2] !== undefined) {
			nodes.push({
				type: "text",
				text: match[2],
				marks: [{ type: "bold" }],
			});
		} else if (match[3] !== undefined) {
			nodes.push({
				type: "text",
				text: match[3],
				marks: [{ type: "italic" }],
			});
		} else if (match[4] !== undefined) {
			nodes.push({
				type: "text",
				text: match[4],
				marks: [{ type: "strike" }],
			});
		} else if (match[5]) {
			nodes.push({ type: "text", text: match[5] });
		}
	}
	return nodes;
}

function paragraph(text: string): TipTapNode {
	const content = parseInline(text);
	return content.length > 0
		? { type: "paragraph", content }
		: { type: "paragraph" };
}

const imageLinePattern = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

function parseImageLine(line: string): TipTapNode | null {
	const match = imageLinePattern.exec(line.trim());
	if (!match) return null;
	const attrs: Record<string, unknown> = {
		src: match[2],
		alt: match[1] ?? "",
	};
	if (match[3]) {
		attrs.title = match[3];
	}
	return { type: "image", attrs };
}

export function markdownToTipTap(markdown: string): JsonValue {
	const source = markdown.replace(/\r\n/g, "\n").trim();
	if (!source) {
		return emptyDocumentDescription;
	}

	const lines = source.split("\n");
	const content: TipTapNode[] = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index] ?? "";

		if (line.trim() === "") {
			index += 1;
			continue;
		}

		if (line.trim() === "---") {
			content.push({ type: "horizontalRule" });
			index += 1;
			continue;
		}

		const imageNode = parseImageLine(line);
		if (imageNode) {
			content.push(imageNode);
			index += 1;
			continue;
		}

		if (line.startsWith("```")) {
			const codeLines: string[] = [];
			index += 1;
			while (index < lines.length && !(lines[index] ?? "").startsWith("```")) {
				codeLines.push(lines[index] ?? "");
				index += 1;
			}
			if (index < lines.length) index += 1;
			content.push({
				type: "codeBlock",
				content: codeLines.length
					? [{ type: "text", text: codeLines.join("\n") }]
					: [],
			});
			continue;
		}

		const heading = /^(#{1,6})\s+(.*)$/.exec(line);
		if (heading) {
			const text = heading[2] ?? "";
			content.push({
				type: "heading",
				attrs: { level: heading[1]?.length ?? 1 },
				content: parseInline(text),
			});
			index += 1;
			continue;
		}

		if (line.startsWith("> ")) {
			const quoteLines: string[] = [];
			while (index < lines.length && (lines[index] ?? "").startsWith("> ")) {
				quoteLines.push((lines[index] ?? "").slice(2));
				index += 1;
			}
			content.push({
				type: "blockquote",
				content: [paragraph(quoteLines.join("\n"))],
			});
			continue;
		}

		if (/^[-*]\s+/.test(line)) {
			const items: TipTapNode[] = [];
			while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? "")) {
				items.push({
					type: "listItem",
					content: [paragraph((lines[index] ?? "").replace(/^[-*]\s+/, ""))],
				});
				index += 1;
			}
			content.push({ type: "bulletList", content: items });
			continue;
		}

		if (/^\d+\.\s+/.test(line)) {
			const items: TipTapNode[] = [];
			while (index < lines.length && /^\d+\.\s+/.test(lines[index] ?? "")) {
				items.push({
					type: "listItem",
					content: [paragraph((lines[index] ?? "").replace(/^\d+\.\s+/, ""))],
				});
				index += 1;
			}
			content.push({ type: "orderedList", content: items });
			continue;
		}

		const paragraphLines: string[] = [line];
		index += 1;
		while (
			index < lines.length &&
			(lines[index] ?? "").trim() !== "" &&
			!/^(#{1,6})\s+/.test(lines[index] ?? "") &&
			!(lines[index] ?? "").startsWith("```") &&
			!(lines[index] ?? "").startsWith("> ") &&
			!/^[-*]\s+/.test(lines[index] ?? "") &&
			!/^\d+\.\s+/.test(lines[index] ?? "") &&
			!imageLinePattern.test((lines[index] ?? "").trim())
		) {
			paragraphLines.push(lines[index] ?? "");
			index += 1;
		}
		content.push(paragraph(paragraphLines.join("\n")));
	}

	return {
		type: "doc",
		content: content.length ? content : [{ type: "paragraph" }],
	} as JsonValue;
}
