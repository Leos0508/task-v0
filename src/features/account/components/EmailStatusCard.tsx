import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";

export default function EmailStatusCard({
	email,
	verified,
}: {
	email: string;
	verified: boolean;
}) {
	const [pending, setPending] = useState(false);

	async function resend() {
		setPending(true);
		try {
			const { error } = await authClient.sendVerificationEmail({
				email,
				callbackURL: "/verify-email",
			});
			if (error) {
				toast.error(error.message ?? "Failed to send verification email");
				return;
			}
			toast.success("Verification email sent");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="flex max-w-lg items-center justify-between gap-3">
			<div>
				<p className="text-sm font-medium">{email}</p>
				<p className="text-sm text-muted-foreground">
					{verified
						? "This address is verified."
						: "This address is not verified yet."}
				</p>
			</div>
			{verified ? (
				<Badge variant="secondary">Verified</Badge>
			) : (
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={pending}
					onClick={() => void resend()}
				>
					{pending ? "Sending…" : "Resend"}
				</Button>
			)}
		</div>
	);
}
