import { createFileRoute, Outlet } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";

export const Route = createFileRoute("/app/$code/issues")({
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: () => (
		<div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
			<Outlet />
		</div>
	),
});
