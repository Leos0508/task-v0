import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import SignInForm from "#/components/SignInForm";
import { safeInternalPath } from "#/lib/safe-path";

export const Route = createFileRoute("/sign-in")({
	validateSearch: z.object({
		redirect: z.string().optional(),
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { redirect: redirectTo } = Route.useSearch();

	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<SignInForm next={safeInternalPath(redirectTo)} />
		</div>
	);
}
