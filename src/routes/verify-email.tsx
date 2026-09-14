import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import AuthSplitLayout from "#/components/AuthSplitLayout";
import VerifyEmailCard from "#/components/VerifyEmailCard";

export const Route = createFileRoute("/verify-email")({
	validateSearch: z.object({
		token: z.string().optional(),
		sent: z
			.union([z.boolean(), z.literal("true"), z.literal("false")])
			.optional()
			.transform((value) => value === true || value === "true"),
	}),
	component: VerifyEmailPage,
});

function VerifyEmailPage() {
	const { token, sent } = Route.useSearch();

	return (
		<AuthSplitLayout>
			<VerifyEmailCard token={token} sent={sent} />
		</AuthSplitLayout>
	);
}
