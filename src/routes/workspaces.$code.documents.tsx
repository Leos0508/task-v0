import { createFileRoute, Outlet } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";

export const Route = createFileRoute("/workspaces/$code/documents")({
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: () => <Outlet />,
});
