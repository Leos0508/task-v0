import { useForm, useSelector } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { authClient } from "@/lib/auth-client";

const signUpSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		email: z.email(),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(/[A-Z]/, "Password must include an uppercase letter"),
		confirmPassword: z.string().min(1, "Confirm password is required"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export default function SignUpForm() {
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		validators: {
			onSubmit: signUpSchema,
		},
		onSubmit: async ({ value }) => {
			const { name, email, password } = value;
			await authClient.signUp.email(
				{
					name,
					email,
					password,
				},
				{
					onSuccess: async () => {
						toast.success("Sign up success");
						// TODO: redirect based on search
						navigate({ to: "/sign-in" });
					},
					onError: (ctx) => {
						toast.error(`Failed to sign up: ${ctx.error.message}`);
					},
				},
			);
		},
	});

	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

	return (
		<form
			className="max-w-lg w-full"
			id="sign-up-form"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Sign Up</CardTitle>
					<CardDescription>Create your account</CardDescription>
				</CardHeader>
				<CardContent>
					<FieldGroup>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Name</FieldLabel>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="John Doe"
											type="text"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
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
						<form.Field name="confirmPassword">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Confirm Password
										</FieldLabel>
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
							"Sign Up"
						)}
					</Button>
					<p className="text-sm">
						Already have an account?{" "}
						<Link to="/sign-in" className="underline text-primary">
							Sign In
						</Link>
					</p>
				</CardFooter>
			</Card>
		</form>
	);
}
