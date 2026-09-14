import { useForm, useSelector } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
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
import { forgotPasswordSchema } from "#/features/auth/schema";
import { authClient } from "#/lib/auth-client";

export default function ForgotPasswordForm() {
	const [sent, setSent] = useState(false);
	const form = useForm({
		defaultValues: { email: "" },
		validators: { onSubmit: forgotPasswordSchema },
		onSubmit: async ({ value }) => {
			const { error } = await authClient.requestPasswordReset({
				email: value.email,
				redirectTo: "/reset-password",
			});
			if (error) {
				toast.error(error.message ?? "Failed to send reset email");
				return;
			}
			setSent(true);
		},
	});
	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

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
					<CardTitle>Forgot password</CardTitle>
					<CardDescription>
						{sent
							? "If that email is registered, we sent a reset link."
							: "Enter your email and we will send a reset link if an account exists."}
					</CardDescription>
				</CardHeader>
				{sent ? null : (
					<CardContent>
						<FieldGroup>
							<form.Field name="email">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Email</FieldLabel>
											<Input
												id={field.name}
												type="email"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												aria-invalid={isInvalid}
												placeholder="johndoe@email.com"
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
				)}
				<CardFooter className="flex flex-col gap-2">
					{sent ? null : (
						<Button
							className="w-full"
							size="lg"
							type="submit"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : (
								"Send reset link"
							)}
						</Button>
					)}
					<p className="text-sm">
						<Link to="/sign-in" className="text-primary underline">
							Back to sign in
						</Link>
					</p>
				</CardFooter>
			</Card>
		</form>
	);
}
