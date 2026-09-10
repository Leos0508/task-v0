import type { IssueStatus } from "#/db/schema";
import type { ReorderIssueInput } from "#/features/issues/schema";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import { compareIssueRank } from "#/lib/issue-rank";

export const ISSUE_CARD = "issue-card";

export function isIssueCardData(
	data: Record<string, unknown>,
): data is { type: typeof ISSUE_CARD; issue: IssueListItem } {
	return (
		data.type === ISSUE_CARD &&
		typeof data.issue === "object" &&
		data.issue !== null &&
		"id" in data.issue &&
		"status" in data.issue &&
		"number" in data.issue
	);
}

export function reorderInputAtIndex(
	status: IssueStatus,
	others: IssueListItem[],
	insertAt: number,
): ReorderIssueInput {
	const target = others[insertAt];
	if (!target) return { status };
	return { status, targetIssueId: target.id, edge: "top" };
}

export function placementInputFromList(
	rows: IssueListItem[],
	issueId: string,
): ReorderIssueInput | null {
	const issue = rows.find((row) => row.id === issueId);
	if (!issue) return null;
	const column = rows
		.filter((row) => row.status === issue.status)
		.sort(compareIssueRank);
	const insertAt = column.findIndex((row) => row.id === issueId);
	if (insertAt === -1) return null;
	return reorderInputAtIndex(
		issue.status,
		column.filter((row) => row.id !== issueId),
		insertAt,
	);
}

export function dropCardsInList(listElement: HTMLElement, draggingId: string) {
	return [
		...listElement.querySelectorAll<HTMLElement>("[data-board-card]"),
	].filter((card) => card.dataset.issueId !== draggingId);
}

export function reorderInputFromPointer(
	status: IssueStatus,
	listElement: HTMLElement,
	clientY: number,
	draggingId: string,
): ReorderIssueInput {
	for (const card of dropCardsInList(listElement, draggingId)) {
		const rect = card.getBoundingClientRect();
		const targetIssueId = card.dataset.issueId;
		if (!targetIssueId) continue;
		if (clientY < rect.top + rect.height / 2) {
			return { status, targetIssueId, edge: "top" };
		}
	}
	return { status };
}

export function placeholderBeforeId(
	listElement: HTMLElement,
	clientY: number,
	draggingId: string,
): string | null {
	for (const card of dropCardsInList(listElement, draggingId)) {
		const rect = card.getBoundingClientRect();
		const targetIssueId = card.dataset.issueId;
		if (!targetIssueId) continue;
		if (clientY < rect.top + rect.height / 2) return targetIssueId;
	}
	return null;
}
