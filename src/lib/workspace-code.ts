export function slugifyWorkspaceCode(name: string): string {
	const cleaned = name
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9\s]/g, " ");
	const words = cleaned.split(/\s+/).filter(Boolean);

	if (words.length === 0) {
		return "";
	}

	if (words.length === 1) {
		return words[0].slice(0, 4);
	}

	return words
		.map((word) => word[0])
		.join("")
		.slice(0, 8);
}

export function normalizeWorkspaceCode(code: string): string {
	return code
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "");
}
