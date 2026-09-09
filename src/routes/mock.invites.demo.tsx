import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { mockWorkspace } from "#/mock/fixtures";

export const Route = createFileRoute("/mock/invites/demo")({
	component: MockInvitePage,
});

function MockInvitePage() {
	const navigate = useNavigate();

	return (
		<div className="flex h-full w-full items-center justify-center p-6">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Workspace invite</CardTitle>
					<CardDescription>
						You were invited to join {mockWorkspace.name}.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						className="w-full"
						onClick={() => {
							toast.success("Joined mock workspace");
							navigate({ to: "/mock/app/v0" });
						}}
					>
						Accept invite
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
