import { useForm, useSelector } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { workspaceKeys } from "#/features/workspaces/queries";
import { updateWorkspaceSchema } from "#/features/workspaces/schema";
import { updateWorkspaceFn } from "#/lib/functions/workspaces.functions";
import { getRandomPastelHexColor } from "#/lib/utils";

type WorkspaceGeneralFormProps = {
	workspace: {
		name: string;
		code: string;
		color: string;
	};
	readOnly?: boolean;
};

export default function WorkspaceGeneralForm({
	workspace,
	readOnly = false,
}: WorkspaceGeneralFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const form = useForm({
		defaultValues: {
			name: workspace.name,
			code: workspace.code,
			color: workspace.color,
		},
		validators: { onSubmit: updateWorkspaceSchema },
		onSubmit: async ({ value }) => {
			const result = await updateWorkspaceFn({
				data: { workspaceCode: workspace.code, input: value },
			});
			if (!result.success) {
				toast.error(result.error.message);
				return;
			}
			toast.success("Workspace updated");
			await queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
			if (result.data?.code && result.data.code !== workspace.code) {
				navigate({
					to: "/workspaces/$code/settings",
					params: { code: result.data.code },
				});
			}
		},
	});

	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

	return (
		<form
			className="max-w-lg"
			onSubmit={(e) => {
				e.preventDefault();
				if (readOnly) return;
				form.handleSubmit();
			}}
		>
			{readOnly && (
				<p className="text-sm text-muted-foreground mb-4">
					Only an owner can change workspace name, code, and color.
				</p>
			)}
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
									disabled={readOnly}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
				<form.Field name="code">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Code</FieldLabel>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) =>
										field.handleChange(e.target.value.toUpperCase())
									}
									className="font-mono uppercase"
									disabled={readOnly}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
				<form.Field name="color">
					{(field) => (
						<Field>
							<FieldLabel>Color</FieldLabel>
							<div className="flex items-center gap-2">
								<input
									type="color"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5 disabled:cursor-not-allowed"
									disabled={readOnly}
								/>
								<Input
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									className="font-mono uppercase"
									disabled={readOnly}
								/>
								{!readOnly && (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() =>
											field.handleChange(getRandomPastelHexColor())
										}
									>
										<RefreshCwIcon />
									</Button>
								)}
							</div>
						</Field>
					)}
				</form.Field>
				{!readOnly && (
					<Button type="submit" disabled={isSubmitting} className="w-fit">
						{isSubmitting ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							"Save changes"
						)}
					</Button>
				)}
			</FieldGroup>
		</form>
	);
}
