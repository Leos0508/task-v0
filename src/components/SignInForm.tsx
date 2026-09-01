import { useForm, useSelector } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#/components/ui/input-group";
import { signInSchema } from "#/features/auth/schema";
import { authClient } from "#/lib/auth-client";
import { safeInternalPath } from "#/lib/safe-path";

const SignInForm = ({ next = "/workspaces" }: { next?: string }) => {
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: signInSchema,
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(value, {
				onSuccess: () => {
					toast.success("Sign in success");
					navigate({ href: safeInternalPath(next) });
				},
				onError: (ctx) => {
					toast.error(`Failed to sign in: ${ctx.error.message}`);
				},
			});
		},
	});

	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

	return (
		<form
			className="max-w-lg w-full"
			id="sign-in-form"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Sign In</CardTitle>
					<CardDescription>Sign in to access our features</CardDescription>
				</CardHeader>
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
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="johndoe@email.com"
											type="email"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="password">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Password</FieldLabel>
										<InputGroup>
											<InputGroupInput
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="************"
												type={showPassword ? "text" : "password"}
											/>
											<InputGroupAddon align="inline-end">
												<InputGroupButton
													size="icon-sm"
													type="button"
													onClick={() => setShowPassword((prev) => !prev)}
												>
													{showPassword ? <EyeOffIcon /> : <EyeIcon />}
												</InputGroupButton>
											</InputGroupAddon>
										</InputGroup>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>
				</CardContent>
				<CardFooter className="flex flex-col gap-2">
					<Button
						className="w-full"
						size="lg"
						type="submit"
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							"Sign In"
						)}
					</Button>
					<p className="text-sm">
						Don&apos;t have an account?{" "}
						<Link to="/sign-up" className="underline text-primary">
							Sign Up
						</Link>
					</p>
				</CardFooter>
			</Card>
		</form>
	);
};

export default SignInForm;
