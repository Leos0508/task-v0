import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthSession } from "#/lib/auth.functions";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const session = await getAuthSession();
		throw redirect({ to: session ? "/workspaces" : "/sign-in" });
	},
	component: () => null,
});
