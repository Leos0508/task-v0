export function safeInternalPath(
	value: string | undefined | null,
	fallback = "/app",
) {
	if (!value || !value.startsWith("/") || value.startsWith("//")) {
		return fallback;
	}

	return value;
}
