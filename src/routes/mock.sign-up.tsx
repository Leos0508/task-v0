import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import Logo from "#/components/Logo";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#/components/ui/input-group";

export const Route = createFileRoute("/mock/sign-up")({
	component: MockSignUpPage,
});

function MockSignUpPage() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="flex h-screen w-screen items-center justify-center overflow-hidden">
			<div className="flex h-full w-1/3 flex-col items-start justify-center bg-primary p-8 text-primary-foreground">
				<Link to="/mock">
					<Logo className="h-24 w-48 text-primary-foreground" />
				</Link>
				<p className="text-sm">
					Editorial mock of the sign-up split layout. Continue skips auth.
				</p>
			</div>
			<div className="flex h-full w-2/3 items-center justify-center bg-accent p-8 text-accent-foreground">
				<form
					className="w-full max-w-lg"
					onSubmit={(event) => {
						event.preventDefault();
						navigate({ to: "/mock/app" });
					}}
				>
					<Card className="w-full">
						<CardHeader>
							<CardTitle>Sign Up</CardTitle>
							<CardDescription>
								Create an account to get started
							</CardDescription>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="mock-name">Name</FieldLabel>
									<Input id="mock-name" defaultValue="Nora Chen" />
								</Field>
								<Field>
									<FieldLabel htmlFor="mock-signup-email">Email</FieldLabel>
									<Input
										id="mock-signup-email"
										type="email"
										defaultValue="nora@example.com"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="mock-signup-password">
										Password
									</FieldLabel>
									<InputGroup>
										<InputGroupInput
											id="mock-signup-password"
											type={showPassword ? "text" : "password"}
											defaultValue="password"
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
								</Field>
							</FieldGroup>
						</CardContent>
						<CardFooter className="flex flex-col gap-2">
							<Button className="w-full" size="lg" type="submit">
								Continue
							</Button>
							<p className="text-sm">
								Already have an account?{" "}
								<Link to="/mock/sign-in" className="text-primary underline">
									Sign In
								</Link>
							</p>
						</CardFooter>
					</Card>
				</form>
			</div>
		</div>
	);
}
