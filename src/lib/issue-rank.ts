export const RANK_GAP = 1024;

export function rankBetween(
	before: number | null,
	after: number | null,
): number | null {
	if (before == null && after == null) return RANK_GAP;
	if (before == null) return (after ?? 0) - RANK_GAP;
	if (after == null) return before + RANK_GAP;
	const mid = Math.trunc((before + after) / 2);
	if (mid <= before || mid >= after) return null;
	return mid;
}

export function compareIssueRank(
	a: { rank: number; number: number },
	b: { rank: number; number: number },
) {
	return a.rank - b.rank || b.number - a.number;
}

export function insertIndex(
	targetIndex: number,
	edge: "top" | "bottom" | undefined,
	length: number,
) {
	if (targetIndex < 0) return length;
	return edge === "top" ? targetIndex : targetIndex + 1;
}
