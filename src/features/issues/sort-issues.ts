import type { IssueListItem } from "#/lib/data/fetch-issues";
import type { IssueSortField } from "./schema";

const STATUS_RANK = {
	TODO: 0,
	IN_PROGRESS: 1,
	DONE: 2,
	CANCELLED: 3,
} as const;

const PRIORITY_RANK = {
	URGENT: 0,
	HIGH: 1,
	MEDIUM: 2,
	LOW: 3,
} as const;

function compareNullableTime(
	left: string | null,
	right: string | null,
	direction: number,
) {
	if (left == null && right == null) return 0;
	if (left == null) return 1;
	if (right == null) return -1;
	return (new Date(left).getTime() - new Date(right).getTime()) * direction;
}

function compareIssues(
	left: IssueListItem,
	right: IssueListItem,
	field: IssueSortField,
	dir: number,
) {
	switch (field) {
		case "number":
			return (left.number - right.number) * dir;
		case "title":
			return left.title.localeCompare(right.title) * dir;
		case "status":
			return (STATUS_RANK[left.status] - STATUS_RANK[right.status]) * dir;
		case "priority": {
			const leftRank = left.priority ? PRIORITY_RANK[left.priority] : 4;
			const rightRank = right.priority ? PRIORITY_RANK[right.priority] : 4;
			return (leftRank - rightRank) * dir;
		}
		case "createdAt":
		case "updatedAt":
			return (
				(new Date(left[field]).getTime() - new Date(right[field]).getTime()) *
				dir
			);
		case "startDate":
		case "endDate":
			return compareNullableTime(left[field], right[field], dir);
		default:
			return 0;
	}
}

export function sortIssues(
	issues: IssueListItem[],
	field: IssueSortField,
	direction: "asc" | "desc",
) {
	const dir = direction === "asc" ? 1 : -1;
	return [...issues].sort((left, right) => {
		const primary = compareIssues(left, right, field, dir);
		if (primary !== 0) return primary;
		if (field === "number") return 0;
		return left.number - right.number;
	});
}
