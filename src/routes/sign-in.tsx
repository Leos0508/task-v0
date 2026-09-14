import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import AuthSplitLayout from "#/components/AuthSplitLayout";
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
		<AuthSplitLayout>
			<SignInForm next={safeInternalPath(redirectTo)} />
		</AuthSplitLayout>
	);
}
