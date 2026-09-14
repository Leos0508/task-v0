import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { authKeys } from "#/features/auth/queries";
import { authClient } from "#/lib/auth-client";

export default function VerifyEmailCard({
	token,
	sent,
}: {
	token?: string;
	sent?: boolean;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">(
		token ? "pending" : "idle",
	);

	useEffect(() => {
		if (!token) return;
		let cancelled = false;
		void authClient.verifyEmail({ query: { token } }).then(({ error }) => {
			if (cancelled) return;
			if (error) {
				setStatus("error");
				toast.error(error.message ?? "Could not verify this email");
				return;
			}
			setStatus("ok");
			void queryClient.invalidateQueries({ queryKey: authKeys.session });
			toast.success("Email verified");
		});
		return () => {
			cancelled = true;
		};
	}, [queryClient, token]);

	const title =
		status === "ok"
			? "Email verified"
			: status === "error"
				? "Verification failed"
				: sent
					? "Check your email"
					: "Verify your email";

	const description =
		status === "ok"
			? "Your address is confirmed. You can continue to the app."
			: status === "error"
				? "This link is invalid or has expired. Request a new one from your account."
				: sent
					? "We sent a verification link. Open it to confirm your address, then sign in."
					: "Open the link from your inbox, or sign in and resend it from Account.";

	return (
		<Card className="w-full max-w-lg">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			{status === "pending" ? (
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Confirming your email…
					</p>
				</CardContent>
			) : null}
			<CardFooter className="flex flex-col gap-2">
				{status === "ok" ? (
					<Button
						className="w-full"
						size="lg"
						onClick={() => navigate({ to: "/app" })}
					>
						Continue
					</Button>
				) : (
					<Button asChild className="w-full" size="lg">
						<Link to="/sign-in">Sign in</Link>
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
