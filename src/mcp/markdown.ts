import { emptyDocumentDescription } from "#/features/documents/schema";
import type { JsonValue } from "#/types/json";

type TipTapMark = {
	type: string;
	attrs?: Record<string, unknown>;
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

const MARK_ORDER = [
	"code",
	"bold",
	"italic",
	"strike",
	"underline",
	"link",
] as const;

function applyMarks(text: string, marks: TipTapMark[] | undefined) {
	if (!marks?.length) return text;
	const sorted = [...marks].sort(
		(a, b) =>
			MARK_ORDER.indexOf(a.type as (typeof MARK_ORDER)[number]) -
			MARK_ORDER.indexOf(b.type as (typeof MARK_ORDER)[number]),
	);
	let result = text;
	for (const mark of sorted) {
		if (mark.type === "code") {
			result = `\`${result}\``;
		} else if (mark.type === "bold") {
			result = `**${result}**`;
		} else if (mark.type === "italic") {
			result = `*${result}*`;
		} else if (mark.type === "strike") {
			result = `~~${result}~~`;
		} else if (mark.type === "underline") {
			result = `<u>${result}</u>`;
		} else if (mark.type === "link") {
			const href = String(mark.attrs?.href ?? "");
			result = href ? `[${result}](${href})` : result;
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
		case "codeBlock": {
			const language = String(node.attrs?.language ?? "");
			return `\`\`\`${language}\n${inlineText(node.content)}\n\`\`\``;
		}
		case "mermaid":
			return `\`\`\`mermaid\n${inlineText(node.content)}\n\`\`\``;
		case "table":
			return renderTable(node);
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

function cellText(cell: TipTapNode) {
	return inlineText(cell.content?.[0]?.content ?? cell.content).replaceAll(
		"|",
		"\\|",
	);
}

function renderTable(node: TipTapNode): string {
	const rows = (node.content ?? []).map((row) =>
		(row.content ?? []).map((cell) => cellText(cell)),
	);
	const colCount = Math.max(0, ...rows.map((row) => row.length));
	if (colCount === 0) return "";

	const padded = rows.map((row) => {
		const cells = [...row];
		while (cells.length < colCount) cells.push("");
		return cells;
	});
	const format = (cells: string[]) => `| ${cells.join(" | ")} |`;
	const header = padded[0] ?? Array.from({ length: colCount }, () => "");
	const separator = Array.from({ length: colCount }, () => "---");
	const body = padded.slice(1);
	return [format(header), format(separator), ...body.map(format)].join("\n");
}

export function tipTapToMarkdown(value: JsonValue | null | undefined): string {
	const root = asNode(value);
	if (!root) return "";
	const blocks = (root.content ?? [])
		.map((node) => renderBlock(node))
		.filter((block) => block.length > 0);
	return blocks.join("\n\n");
}

function withMark(text: string, mark: TipTapMark): TipTapNode[] {
	const inner = parseInline(text);
	const parts = inner.length ? inner : [{ type: "text" as const, text }];
	return parts.map((part) => ({
		...part,
		marks: [...(part.marks ?? []), mark],
	}));
}

function parseInline(text: string): TipTapNode[] {
	if (!text) return [];
	const nodes: TipTapNode[] = [];
	const pattern =
		/`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|~~([^~]+)~~|(?<![A-Za-z0-9])\+\+([^+]+)\+\+|<u>([\s\S]*?)<\/u>|\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|([^*~`[<+]+|\+)/g;
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
		} else if (match[5] !== undefined) {
			nodes.push(...withMark(match[5], { type: "underline" }));
		} else if (match[6] !== undefined) {
			nodes.push(...withMark(match[6], { type: "underline" }));
		} else if (match[7] !== undefined) {
			nodes.push(
				...withMark(match[7], {
					type: "link",
					attrs: { href: match[8] ?? "" },
				}),
			);
		} else if (match[9]) {
			nodes.push({ type: "text", text: match[9] });
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

function splitTableCells(line: string) {
	let trimmed = line.trim();
	if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
	if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
	return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparatorCells(cells: string[]) {
	return (
		cells.length > 0 &&
		cells.every((cell) => /^:?-+:?$/.test(cell.replace(/\s/g, "")))
	);
}

export function looksLikeGfmTable(text: string) {
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	return looksLikeTableStart(lines, 0);
}

export function looksLikeMarkdownBlocks(text: string) {
	const normalized = text.replace(/\r\n/g, "\n");
	if (!normalized.trim()) return false;
	const lines = normalized.split("\n");
	if (lines.some((_, index) => looksLikeTableStart(lines, index))) return true;
	if (/^```/m.test(normalized)) return true;
	if (/^#{1,6}\s+\S/m.test(normalized)) return true;
	if (/^>\s+\S/m.test(normalized) && lines.length > 1) return true;
	if (lines.filter((line) => /^[-*]\s+\S/.test(line)).length >= 2) return true;
	if (lines.filter((line) => /^\d+\.\s+\S/.test(line)).length >= 2) return true;
	return false;
}

function looksLikeTableStart(lines: string[], index: number) {
	const row = splitTableCells(lines[index] ?? "");
	const next = splitTableCells(lines[index + 1] ?? "");
	return (
		row.length >= 2 && isSeparatorCells(next) && next.length === row.length
	);
}

function tableCell(text: string, header: boolean): TipTapNode {
	return {
		type: header ? "tableHeader" : "tableCell",
		content: [paragraph(text)],
	};
}

function parseTable(lines: string[], start: number) {
	const headerCells = splitTableCells(lines[start] ?? "");
	let index = start + 2;
	const rows: TipTapNode[] = [
		{
			type: "tableRow",
			content: headerCells.map((cell) => tableCell(cell, true)),
		},
	];
	while (index < lines.length && looksLikeTableRow(lines[index] ?? "")) {
		const cells = splitTableCells(lines[index] ?? "");
		while (cells.length < headerCells.length) cells.push("");
		rows.push({
			type: "tableRow",
			content: cells
				.slice(0, headerCells.length)
				.map((cell) => tableCell(cell, false)),
		});
		index += 1;
	}
	return {
		node: { type: "table", content: rows } satisfies TipTapNode,
		nextIndex: index,
	};
}

function looksLikeTableRow(line: string) {
	const trimmed = line.trim();
	if (trimmed === "" || trimmed.startsWith("```") || trimmed.startsWith("> ")) {
		return false;
	}
	return trimmed.includes("|");
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
			const language = line.slice(3).trim();
			const codeLines: string[] = [];
			index += 1;
			while (index < lines.length && !(lines[index] ?? "").startsWith("```")) {
				codeLines.push(lines[index] ?? "");
				index += 1;
			}
			if (index < lines.length) index += 1;
			const text = codeLines.join("\n");
			if (language === "mermaid") {
				content.push({
					type: "mermaid",
					content: text ? [{ type: "text", text }] : [],
				});
			} else {
				content.push({
					type: "codeBlock",
					attrs: language ? { language } : undefined,
					content: text ? [{ type: "text", text }] : [],
				});
			}
			continue;
		}

		if (looksLikeTableStart(lines, index)) {
			const parsed = parseTable(lines, index);
			content.push(parsed.node);
			index = parsed.nextIndex;
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
			!imageLinePattern.test((lines[index] ?? "").trim()) &&
			!looksLikeTableStart(lines, index)
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
