import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/mock/app")({
	component: () => <Outlet />,
});
