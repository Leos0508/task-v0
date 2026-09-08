import { type ComponentType, lazy } from "react";

const RELOAD_KEY = "stale-dynamic-import-reload";

const STALE_IMPORT_RE =
	/Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

export function isStaleDynamicImportError(error: unknown) {
	const message = error instanceof Error ? error.message : String(error);
	return STALE_IMPORT_RE.test(message);
}

export function reloadOnceForStaleDynamicImport() {
	if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
		return false;
	}
	if (sessionStorage.getItem(RELOAD_KEY) === "1") {
		return false;
	}
	sessionStorage.setItem(RELOAD_KEY, "1");
	window.location.reload();
	return true;
}

export function lazyImport<P>(
	loader: () => Promise<{ default: ComponentType<P> }>,
) {
	return lazy(async () => {
		try {
			const mod = await loader();
			if (typeof sessionStorage !== "undefined") {
				sessionStorage.removeItem(RELOAD_KEY);
			}
			return mod;
		} catch (error) {
			if (
				isStaleDynamicImportError(error) &&
				reloadOnceForStaleDynamicImport()
			) {
				return new Promise<{ default: ComponentType<P> }>(() => {});
			}
			throw error;
		}
	});
}
