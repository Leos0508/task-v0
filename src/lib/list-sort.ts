export type SortDirection = "asc" | "desc";

export function defaultDirForListField(field: string): SortDirection {
	if (
		field === "title" ||
		field === "name" ||
		field === "status" ||
		field === "priority"
	) {
		return "asc";
	}
	return "desc";
}

export function nextListSort<F extends string>(
	current: { sort: F; dir: SortDirection },
	field: F,
): { sort: F; dir: SortDirection } {
	if (current.sort === field) {
		return { sort: field, dir: current.dir === "asc" ? "desc" : "asc" };
	}
	return { sort: field, dir: defaultDirForListField(field) };
}

export function selectListSortField<F extends string>(
	current: { sort: F; dir: SortDirection },
	field: F,
): { sort: F; dir: SortDirection } {
	if (current.sort === field) {
		return current;
	}
	return { sort: field, dir: defaultDirForListField(field) };
}
