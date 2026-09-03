import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

function getErrorMessage(error: unknown) {
	const message = error instanceof Error ? error.message : String(error);

	if (message.includes("hung and would never generate a response")) {
		return "The server took too long to respond. Please try again.";
	}

	if (message.includes("Failed query:")) {
		return "Couldn't load this data. Please try again.";
	}

	return (
		message.replace(/^(Error:\s*)+/, "").trim() ||
		"An unexpected error occurred."
	);
}

export default function PageError({ error }: ErrorComponentProps) {
	const router = useRouter();

	return (
		<div className="flex h-full min-h-40 w-full items-center justify-center p-6">
			<div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center shadow-sm">
				<p className="font-heading text-lg font-semibold">
					Something went wrong
				</p>
				<p className="text-sm text-muted-foreground">
					{getErrorMessage(error)}
				</p>
				<div className="flex flex-wrap items-center justify-center gap-2">
					<Button type="button" onClick={() => router.invalidate()}>
						Retry
					</Button>
					<Button variant="outline" asChild>
						<Link to="/app">App</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
