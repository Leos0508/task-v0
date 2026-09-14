import { createFileRoute } from "@tanstack/react-router";
import AuthSplitLayout from "#/components/AuthSplitLayout";
import ForgotPasswordForm from "#/components/ForgotPasswordForm";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	return (
		<AuthSplitLayout>
			<ForgotPasswordForm />
		</AuthSplitLayout>
	);
}
