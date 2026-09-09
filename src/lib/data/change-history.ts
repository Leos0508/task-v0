import { db } from "#/db";
import { documentHistory, issueHistory } from "#/db/schema";

export const HISTORY_FIELDS = [
	"title",
	"description",
	"status",
	"priority",
	"startDate",
	"endDate",
	"tag",
	"document",
	"issue",
] as const;

export type HistoryField = (typeof HISTORY_FIELDS)[number];

export type HistoryChange = {
	field: HistoryField;
	oldValue: string | null;
	newValue: string | null;
};

export type ChangeHistoryItem = {
	id: string;
	field: HistoryField;
	oldValue: string | null;
	newValue: string | null;
	createdAt: string;
	actor: {
		id: string;
		name: string;
	};
};

export function jsonSnapshot(value: unknown) {
	return JSON.stringify(value ?? null);
}

export function sameJson(left: unknown, right: unknown) {
	return jsonSnapshot(left) === jsonSnapshot(right);
}

export function tipTapText(value: unknown): string {
	if (value == null || typeof value !== "object") return "";
	const node = value as { text?: unknown; content?: unknown[] };
	const parts: string[] = [];
	if (typeof node.text === "string") parts.push(node.text);
	if (Array.isArray(node.content)) {
		for (const child of node.content) parts.push(tipTapText(child));
	}
	return parts.join("");
}

export function sameInstant(left: Date | null, right: Date | null) {
	if (left == null && right == null) return true;
	if (left == null || right == null) return false;
	return left.getTime() === right.getTime();
}

export function instantValue(value: Date | null) {
	return value?.toISOString() ?? null;
}

export async function insertIssueHistory(
	issueId: string,
	actorId: string,
	changes: HistoryChange[],
) {
	if (changes.length === 0) return;
	await db.insert(issueHistory).values(
		changes.map((change) => ({
			issueId,
			actorId,
			field: change.field,
			oldValue: change.oldValue,
			newValue: change.newValue,
		})),
	);
}

export async function insertDocumentHistory(
	documentId: string,
	actorId: string,
	changes: HistoryChange[],
) {
	if (changes.length === 0) return;
	await db.insert(documentHistory).values(
		changes.map((change) => ({
			documentId,
			actorId,
			field: change.field,
			oldValue: change.oldValue,
			newValue: change.newValue,
		})),
	);
}
