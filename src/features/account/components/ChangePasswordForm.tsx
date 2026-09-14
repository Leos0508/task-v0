import { useForm, useSelector } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { authKeys } from "#/features/auth/queries";
import { changePasswordSchema } from "#/features/auth/schema";
import { authClient } from "#/lib/auth-client";

export default function ChangePasswordForm() {
	const queryClient = useQueryClient();
	const form = useForm({
		defaultValues: {
			currentPassword: "",
			password: "",
			confirmPassword: "",
		},
		validators: { onSubmit: changePasswordSchema },
		onSubmit: async ({ value }) => {
			const { error } = await authClient.changePassword({
				currentPassword: value.currentPassword,
				newPassword: value.password,
				revokeOtherSessions: true,
			});
			if (error) {
				toast.error(error.message ?? "Failed to change password");
				return;
			}
			form.reset();
			await queryClient.invalidateQueries({ queryKey: authKeys.session });
			toast.success("Password updated. Other sessions were signed out.");
		},
	});
	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

	return (
		<form
			className="max-w-lg"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<FieldGroup>
				<form.Field name="currentPassword">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Current password</FieldLabel>
								<Input
									id={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={isInvalid}
								/>
								{isInvalid ? (
									<FieldError errors={field.state.meta.errors} />
								) : null}
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
								<FieldLabel htmlFor={field.name}>New password</FieldLabel>
								<Input
									id={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={isInvalid}
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
									Confirm new password
								</FieldLabel>
								<Input
									id={field.name}
									type="password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={isInvalid}
								/>
								{isInvalid ? (
									<FieldError errors={field.state.meta.errors} />
								) : null}
							</Field>
						);
					}}
				</form.Field>
				<Button type="submit" disabled={isSubmitting} className="w-fit">
					{isSubmitting ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						"Update password"
					)}
				</Button>
			</FieldGroup>
		</form>
	);
}
