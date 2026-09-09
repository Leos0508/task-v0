import { createFileRoute } from "@tanstack/react-router";
import MockLandingNavbar from "#/mock/components/MockLandingNavbar";

export const Route = createFileRoute("/mock/")({
	head: () => ({
		meta: [{ title: "Task mock" }],
	}),
	component: MockLandingPage,
});

function MockLandingPage() {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background">
			<MockLandingNavbar />
			<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
				<p className="font-heading text-4xl font-semibold tracking-tight">
					A personal workspace for issues and documents
				</p>
				<p className="max-w-xl text-muted-foreground">
					This is a clickable editorial mock of the current app. It uses
					fixtures only — no sign-in, database, or server functions.
				</p>
			</main>
		</div>
	);
}
