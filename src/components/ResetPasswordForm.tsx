import { useForm, useSelector } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
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
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { resetPasswordSchema } from "#/features/auth/schema";
import { authClient } from "#/lib/auth-client";

export default function ResetPasswordForm({
	token,
}: {
	token: string | undefined;
}) {
	const navigate = useNavigate();
	const form = useForm({
		defaultValues: { password: "", confirmPassword: "" },
		validators: { onSubmit: resetPasswordSchema },
		onSubmit: async ({ value }) => {
			if (!token) return;
			const { error } = await authClient.resetPassword({
				newPassword: value.password,
				token,
			});
			if (error) {
				toast.error(error.message ?? "Failed to reset password");
				return;
			}
			toast.success("Password updated. Sign in with your new password.");
			navigate({ to: "/sign-in" });
		},
	});
	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

	if (!token) {
		return (
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>Reset password</CardTitle>
					<CardDescription>
						This reset link is missing or invalid. Request a new one.
					</CardDescription>
				</CardHeader>
				<CardFooter>
					<Button asChild className="w-full" size="lg">
						<Link to="/forgot-password">Request a new link</Link>
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<form
			className="w-full max-w-lg"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Reset password</CardTitle>
					<CardDescription>
						Choose a new password for your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FieldGroup>
						<form.Field name="password">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>New password</FieldLabel>
										<Input
											id={field.name}
											type="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={isInvalid}
											placeholder="************"
										/>
										{isInvalid ? (
											<FieldError errors={field.state.meta.errors} />
										) : null}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="confirmPassword">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Confirm password
										</FieldLabel>
										<Input
											id={field.name}
											type="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											aria-invalid={isInvalid}
											placeholder="************"
										/>
										{isInvalid ? (
											<FieldError errors={field.state.meta.errors} />
										) : null}
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>
				</CardContent>
				<CardFooter>
					<Button
						className="w-full"
						size="lg"
						type="submit"
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							"Update password"
						)}
					</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
