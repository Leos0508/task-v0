import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/workspaces")({
	beforeLoad: ({ location }) => {
		throw redirect({
			href: `${location.pathname.replace(/^\/workspaces/, "/app")}${location.searchStr}`,
		});
	},
});
