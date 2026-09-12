import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
	userQuotaQueryOptions,
	workspaceKeys,
} from "#/features/workspaces/queries";
import { acceptInviteFn } from "#/lib/functions/members.functions";
import {
	canJoinMoreWorkspaces,
	MEMBER_LIMIT_MESSAGE,
	WORKSPACE_LIMIT_MESSAGE,
} from "#/lib/quota";

export default function AcceptInviteCard({
	token,
	workspaceName,
	memberCount,
	memberLimit,
}: {
	token: string;
	workspaceName: string;
	memberCount: number;
	memberLimit: number;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: quota } = useQuery(userQuotaQueryOptions);
	const [pending, setPending] = useState(false);
	const atWorkspaceCap = quota != null && !canJoinMoreWorkspaces(quota);
	const atMemberCap =
		quota != null && !quota.exempt && memberCount >= memberLimit;
	const blocked = atWorkspaceCap || atMemberCap;
	const blockMessage = atWorkspaceCap
		? WORKSPACE_LIMIT_MESSAGE
		: MEMBER_LIMIT_MESSAGE;

	async function handleAccept() {
		setPending(true);
		const result = await acceptInviteFn({ data: { token } });
		setPending(false);
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}
		await queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
		await queryClient.invalidateQueries({ queryKey: workspaceKeys.quota });
		toast.success("Joined workspace");
		navigate({
			to: "/app/$code",
			params: { code: result.data?.code ?? "" },
		});
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Workspace invite</CardTitle>
				<CardDescription>
					You were invited to join {workspaceName}.
					{blocked ? ` ${blockMessage}.` : ""}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					onClick={handleAccept}
					disabled={pending || blocked}
					className="w-full"
				>
					{pending ? "Joining…" : "Accept invite"}
				</Button>
			</CardContent>
		</Card>
	);
}
