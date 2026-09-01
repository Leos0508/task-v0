import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { workspaceKeys } from "#/features/workspaces/queries";
import { acceptInviteFn } from "#/lib/functions/members.functions";

export default function AcceptInviteCard({
	token,
	workspaceName,
}: {
	token: string;
	workspaceName: string;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [pending, setPending] = useState(false);

	async function handleAccept() {
		setPending(true);
		const result = await acceptInviteFn({ data: { token } });
		setPending(false);
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}
		await queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
		toast.success("Joined workspace");
		navigate({
			to: "/workspaces/$code",
			params: { code: result.data?.code ?? "" },
		});
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Workspace invite</CardTitle>
				<CardDescription>
					You were invited to join {workspaceName}.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button onClick={handleAccept} disabled={pending} className="w-full">
					{pending ? "Joining…" : "Accept invite"}
				</Button>
			</CardContent>
		</Card>
	);
}
