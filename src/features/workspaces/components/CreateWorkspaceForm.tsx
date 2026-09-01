import { useForm, useSelector } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useRef } from "react";
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
	createWorkspaceFn,
	isWorkspaceCodeAvailableFn,
} from "#/lib/functions/workspaces.functions";
import { getRandomPastelHexColor } from "#/lib/utils";
import { slugifyWorkspaceCode } from "#/lib/workspace-code";
import { workspaceKeys } from "../queries";
import { createWorkspaceSchema } from "../schema";

export default function CreateWorkspaceForm() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const codeDirty = useRef(false);
	const form = useForm({
		defaultValues: {
			name: "",
			color: getRandomPastelHexColor(),
			code: "",
		},
		validators: {
			onSubmit: createWorkspaceSchema,
		},
		onSubmit: async ({ value }) => {
			const result = await createWorkspaceFn({ data: value });

			if (!result.success) {
				toast.error(result.error.message);
				return;
			}

			await queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
			toast.success("Workspace created");
			navigate({
				to: "/workspaces/$code",
				params: { code: result.data?.code ?? "" },
			});
		},
	});

	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

	return (
		<form
			className="w-full max-w-lg"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Create workspace</CardTitle>
					<CardDescription>
						Name it, pick a color, and confirm a unique code
					</CardDescription>
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
											onBlur={(e) => {
												field.handleBlur();
												const name = e.target.value.trim();
												field.setValue(name);
												if (!codeDirty.current) {
													field.form.setFieldValue(
														"code",
														slugifyWorkspaceCode(name),
													);
												}
											}}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="Personal"
											type="text"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field
							name="code"
							validators={{
								onBlurAsyncDebounceMs: 300,
								onBlurAsync: async ({ value }) => {
									const code = value.trim();
									if (code.length < 2) return undefined;
									try {
										const data = await isWorkspaceCodeAvailableFn({
											data: { code },
										});
										return data.available
											? undefined
											: { message: "This code is already taken" };
									} catch {
										return undefined;
									}
								},
							}}
						>
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
											onChange={(e) => {
												codeDirty.current = true;
												field.handleChange(e.target.value.toUpperCase());
											}}
											aria-invalid={isInvalid}
											placeholder="PERS"
											type="text"
											className="font-mono uppercase"
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="color">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;

								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Color</FieldLabel>
										<div className="flex items-center gap-2">
											<input
												id={field.name}
												type="color"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
											/>
											<Input
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												placeholder="#AABBCC"
												type="text"
												className="font-mono uppercase"
											/>
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={() =>
													field.handleChange(getRandomPastelHexColor())
												}
												aria-label="Randomize color"
											>
												<RefreshCwIcon />
											</Button>
										</div>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
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
							"Create workspace"
						)}
					</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
