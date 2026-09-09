import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/mock/app/v0/issues")({
	component: () => <Outlet />,
});
