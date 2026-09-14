import { createFileRoute } from "@tanstack/react-router";
import AuthSplitLayout from "#/components/AuthSplitLayout";
import SignUpForm from "#/components/SignUpForm";

export const Route = createFileRoute("/sign-up")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AuthSplitLayout>
			<SignUpForm />
		</AuthSplitLayout>
	);
}
