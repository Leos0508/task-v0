import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";

export const Route = createFileRoute("/mock/app/create-workspace")({
	component: MockCreateWorkspacePage,
});

function MockCreateWorkspacePage() {
	const navigate = useNavigate();

	return (
		<div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4">
			<Button variant="ghost" className="w-fit" asChild>
				<Link to="/mock/app">
					<ChevronLeft />
					Back
				</Link>
			</Button>
			<div className="flex flex-1 items-center justify-center">
				<form
					className="w-full max-w-lg"
					onSubmit={(event) => {
						event.preventDefault();
						toast.message("Mock only — opened the v0 workspace");
						navigate({ to: "/mock/app/v0" });
					}}
				>
					<Card className="w-full">
						<CardHeader>
							<CardTitle>Create workspace</CardTitle>
							<CardDescription>
								Name it, pick a color, and confirm a unique code
							</CardDescription>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="ws-name">Name</FieldLabel>
									<Input
										id="ws-name"
										placeholder="Personal"
										defaultValue="Task V0"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="ws-code">Code</FieldLabel>
									<Input
										id="ws-code"
										placeholder="PERS"
										defaultValue="V0"
										className="font-mono uppercase"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="ws-color">Color</FieldLabel>
									<div className="flex items-center gap-2">
										<input
											id="ws-color"
											type="color"
											defaultValue="#1a1a1a"
											className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
										/>
										<Input
											defaultValue="#1A1A1A"
											className="font-mono uppercase"
										/>
										<Button
											type="button"
											variant="outline"
											size="icon"
											aria-label="Randomize color"
										>
											<RefreshCwIcon />
										</Button>
									</div>
								</Field>
							</FieldGroup>
						</CardContent>
						<CardFooter>
							<Button className="w-full" size="lg" type="submit">
								Create workspace
							</Button>
						</CardFooter>
					</Card>
				</form>
			</div>
		</div>
	);
}
