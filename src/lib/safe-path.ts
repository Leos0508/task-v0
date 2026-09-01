export function safeInternalPath(
	value: string | undefined | null,
	fallback = "/workspaces",
) {
	if (!value || !value.startsWith("/") || value.startsWith("//")) {
		return fallback;
	}

	return value;
}
