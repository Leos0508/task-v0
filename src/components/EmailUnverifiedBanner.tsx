import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { authKeys } from "#/features/auth/queries";
import { authClient } from "#/lib/auth-client";

export default function EmailUnverifiedBanner({ email }: { email: string }) {
	const queryClient = useQueryClient();
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
			await queryClient.invalidateQueries({ queryKey: authKeys.session });
			toast.success("Verification email sent");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="flex shrink-0 items-center justify-between gap-3 border-b bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-50">
			<p>Verify your email to keep this account recoverable.</p>
			<Button
				type="button"
				size="xs"
				variant="outline"
				disabled={pending}
				onClick={() => void resend()}
			>
				{pending ? "Sending…" : "Resend"}
			</Button>
		</div>
	);
}
