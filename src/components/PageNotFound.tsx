import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

export default function PageNotFound({
	title = "Page not found",
	description = "This page doesn't exist or you don't have access to it.",
}: {
	title?: string;
	description?: string;
}) {
	return (
		<div className="flex h-full min-h-40 w-full items-center justify-center p-6">
			<div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center shadow-sm">
				<p className="font-heading text-lg font-semibold">{title}</p>
				<p className="text-sm text-muted-foreground">{description}</p>
				<Button asChild>
					<Link to="/workspaces">Back to workspaces</Link>
				</Button>
			</div>
		</div>
	);
}
