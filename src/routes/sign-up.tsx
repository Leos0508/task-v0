import Logo from "#/components/Logo";
import SignUpForm from "#/components/SignUpForm";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex h-screen w-screen items-center justify-center overflow-hidden">
			<div className="flex w-1/3 bg-primary text-primary-foreground h-full items-start justify-center p-8 flex-col">
				<Link to="/">
					<Logo className="w-48 h-24 text-primary-foreground" />
				</Link>
				<p className="text-sm">
					This project was made to demonstrate a simple task management
					application with multi tenant features.
				</p>
			</div>
			<div className="flex w-2/3 h-full items-center justify-center bg-accent text-accent-foreground p-8">
				<SignUpForm />
			</div>
		</div>
	);
}
