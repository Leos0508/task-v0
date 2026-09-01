import { z } from "zod";

export const signInSchema = z.object({
	email: z.email(),
	password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
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
