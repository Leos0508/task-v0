import type { DocumentListItem } from "#/lib/data/fetch-documents";
import type { DocumentSortField } from "./schema";

export function sortDocuments(
	documents: DocumentListItem[],
	field: DocumentSortField,
	direction: "asc" | "desc",
) {
	const dir = direction === "asc" ? 1 : -1;
	return [...documents].sort((left, right) => {
		const primary =
			field === "title"
				? left.title.localeCompare(right.title) * dir
				: (new Date(left[field]).getTime() - new Date(right[field]).getTime()) *
					dir;
		if (primary !== 0) return primary;
		return left.id.localeCompare(right.id);
	});
}
