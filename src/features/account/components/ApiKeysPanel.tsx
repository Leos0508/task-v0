import { useForm, useSelector } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import { apiKeyKeys, apiKeysQueryOptions } from "#/features/account/queries";
import {
	type CreateApiKeyInput,
	createApiKeySchema,
} from "#/features/account/schema";
import { authClient } from "#/lib/auth-client";
import { formatDateTime } from "#/lib/utils";

function cursorSnippet(origin: string) {
	return `{
  "mcpServers": {
    "task-v0": {
      "url": "${origin}/api/mcp",
      "headers": {
        "Authorization": "Bearer <api-key>"
      }
    }
  }
}`;
}

export default function ApiKeysPanel() {
	const queryClient = useQueryClient();
	const { data, isPending } = useQuery(apiKeysQueryOptions);
	const [createdKey, setCreatedKey] = useState<string | null>(null);
	const origin =
		typeof window === "undefined"
			? "http://localhost:3000"
			: window.location.origin;

	const form = useForm({
		defaultValues: { name: "" } as CreateApiKeyInput,
		validators: { onSubmit: createApiKeySchema },
		onSubmit: async ({ value }) => {
			const { data: created, error } = await authClient.apiKey.create({
				name: value.name.trim(),
			});
			if (error || !created?.key) {
				toast.error(error?.message ?? "Failed to create API key");
				return;
			}
			setCreatedKey(created.key);
			form.reset();
			await queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
			toast.success("API key created");
		},
	});

	const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);
	const keys = data?.apiKeys ?? [];

	async function copyText(value: string, label: string) {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`${label} copied`);
		} catch {
			toast.error(`Failed to copy ${label.toLowerCase()}`);
		}
	}

	async function revokeKey(keyId: string) {
		const { error } = await authClient.apiKey.delete({
			keyId,
		});
		if (error) {
			toast.error(error.message ?? "Failed to revoke API key");
			return;
		}
		await queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
		toast.success("API key revoked");
	}

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Create a key</CardTitle>
					<CardDescription>
						Use a key in Cursor or other MCP clients. The secret is shown only
						once.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="flex flex-col gap-4"
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							void form.handleSubmit();
						}}
					>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<FieldGroup>
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>Name</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												placeholder="Cursor"
												aria-invalid={isInvalid}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
											/>
											{isInvalid ? (
												<FieldError errors={field.state.meta.errors} />
											) : null}
										</Field>
									</FieldGroup>
								);
							}}
						</form.Field>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
							Create API key
						</Button>
					</form>
					{createdKey ? (
						<div className="mt-4 rounded-lg border bg-muted/40 p-3">
							<p className="mb-2 text-sm font-medium">Copy this key now</p>
							<div className="flex items-start gap-2">
								<code className="min-w-0 flex-1 break-all font-mono text-xs">
									{createdKey}
								</code>
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									onClick={() => {
										void copyText(createdKey, "API key");
									}}
								>
									<CopyIcon />
								</Button>
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Your keys</CardTitle>
					<CardDescription>
						Revoked keys stop working immediately. The full secret is never
						shown again.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isPending ? (
						<p className="text-sm text-muted-foreground">Loading keys…</p>
					) : keys.length === 0 ? (
						<p className="text-sm text-muted-foreground">No API keys yet.</p>
					) : (
						<ul className="flex flex-col gap-3">
							{keys.map((key) => (
								<li
									key={key.id}
									className="flex items-center justify-between gap-4 rounded-lg border p-3"
								>
									<div className="min-w-0">
										<p className="truncate font-medium">
											{key.name ?? "Untitled"}
										</p>
										<p className="font-mono text-xs text-muted-foreground">
											{key.start ?? key.prefix ?? "task_"}…
										</p>
										<p className="text-xs text-muted-foreground">
											Created {formatDateTime(key.createdAt.toString())}
											{key.expiresAt
												? ` · Expires ${formatDateTime(key.expiresAt.toString())}`
												: ""}
										</p>
									</div>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="outline" size="sm">
												Revoke
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													Revoke {key.name ?? "this key"}?
												</AlertDialogTitle>
												<AlertDialogDescription>
													Clients using this key will lose access immediately.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													variant="destructive"
													onClick={() => {
														void revokeKey(key.id);
													}}
												>
													Revoke
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Cursor config</CardTitle>
					<CardDescription>
						Add this to your MCP settings and replace the placeholder with a
						key.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-start gap-2">
						<pre className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
							{cursorSnippet(origin)}
						</pre>
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							onClick={() => {
								void copyText(cursorSnippet(origin), "Cursor config");
							}}
						>
							<CopyIcon />
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
