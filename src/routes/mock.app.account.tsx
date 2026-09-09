import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, CopyIcon } from "lucide-react";
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
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { formatDateTime } from "#/lib/utils";
import MockUserMenu from "#/mock/components/MockUserMenu";
import { mockApiKeys } from "#/mock/fixtures";

export const Route = createFileRoute("/mock/app/account")({
	component: MockAccountPage,
});

function MockAccountPage() {
	const snippet = `{
  "mcpServers": {
    "task-v0": {
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer <api-key>"
      }
    }
  }
}`;

	return (
		<div className="h-full min-h-0 w-full overflow-hidden">
			<div className="flex h-16 items-center justify-between gap-4 p-4">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/mock/app">
							<ChevronLeft />
							Back
						</Link>
					</Button>
					<h1 className="font-heading text-lg font-semibold">Account</h1>
				</div>
				<MockUserMenu />
			</div>
			<Separator />
			<div className="h-full overflow-y-auto px-6 py-8">
				<div className="mb-6">
					<h2 className="font-heading text-xl font-semibold">API keys</h2>
					<p className="text-sm text-muted-foreground">
						Authenticate MCP clients to read workspaces and read or write issues
						and documents.
					</p>
				</div>
				<div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Create a key</CardTitle>
							<CardDescription>
								Use a key in Cursor or other MCP clients. The secret is shown
								only once.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form
								className="flex flex-col gap-4"
								onSubmit={(event) => {
									event.preventDefault();
									toast.message("Mock only — no key created");
								}}
							>
								<FieldGroup>
									<Field>
										<FieldLabel htmlFor="key-name">Name</FieldLabel>
										<Input id="key-name" placeholder="Cursor" />
									</Field>
								</FieldGroup>
								<Button type="submit">Create API key</Button>
							</form>
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
							<ul className="flex flex-col gap-3">
								{mockApiKeys.map((key) => (
									<li
										key={key.id}
										className="flex items-center justify-between gap-4 rounded-lg border p-3"
									>
										<div className="min-w-0">
											<p className="truncate font-medium">{key.name}</p>
											<p className="font-mono text-xs text-muted-foreground">
												{key.start}…
											</p>
											<p className="text-xs text-muted-foreground">
												Created {formatDateTime(key.createdAt)}
												{key.expiresAt
													? ` · Expires ${formatDateTime(key.expiresAt)}`
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
														Revoke {key.name}?
													</AlertDialogTitle>
													<AlertDialogDescription>
														Clients using this key will lose access immediately.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														variant="destructive"
														onClick={() =>
															toast.message("Mock only — key not revoked")
														}
													>
														Revoke
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</li>
								))}
							</ul>
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
									{snippet}
								</pre>
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									onClick={() => toast.success("Cursor config copied")}
								>
									<CopyIcon />
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
