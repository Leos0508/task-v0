import { createFileRoute } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import { Separator } from "#/components/ui/separator";
import DocumentList from "#/features/documents/components/DocumentList";
import { documentsQueryOptions } from "#/features/documents/queries";

export const Route = createFileRoute("/app/$code/documents/")({
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			documentsQueryOptions(params.code),
		);
		return { code: context.access.workspace.code };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: DocumentsPage,
});

function DocumentsPage() {
	const { code } = Route.useLoaderData();

	return (
		<div className="dashboard-page">
			<div className="p-4">
				<h1 className="font-heading text-xl font-semibold">Documents</h1>
				<p className="text-xs text-muted-foreground">
					Create and manage your documents
				</p>
			</div>
			<Separator />
			<div className="flex w-full flex-col overflow-y-auto p-4">
				<DocumentList workspaceCode={code} />
			</div>
		</div>
	);
}
