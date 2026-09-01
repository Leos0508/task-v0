import { createFileRoute } from "@tanstack/react-router";
import SignUpForm from "#/components/SignUpForm";

export const Route = createFileRoute("/sign-up")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<SignUpForm />
		</div>
	);
}
