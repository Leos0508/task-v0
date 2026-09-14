import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import AuthSplitLayout from "#/components/AuthSplitLayout";
import ResetPasswordForm from "#/components/ResetPasswordForm";

export const Route = createFileRoute("/reset-password")({
	validateSearch: z.object({
		token: z.string().optional(),
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token } = Route.useSearch();

	return (
		<AuthSplitLayout>
			<ResetPasswordForm token={token} />
		</AuthSplitLayout>
	);
}
