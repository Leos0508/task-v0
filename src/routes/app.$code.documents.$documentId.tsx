import { createFileRoute, notFound } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import PageNotFound from "#/components/PageNotFound";
import DocumentDetailForm from "#/features/documents/components/DocumentDetailForm";
import { tagsQueryOptions } from "#/features/issues/queries";
import { canManageMembers } from "#/lib/authz/roles";
import { getDocumentFn } from "#/lib/functions/documents.functions";

export const Route = createFileRoute("/app/$code/documents/$documentId")({
	loader: async ({ context, params }) => {
		try {
			const [document] = await Promise.all([
				getDocumentFn({
					data: { code: params.code, id: params.documentId },
				}),
				context.queryClient.ensureQueryData(tagsQueryOptions(params.code)),
			]);
			return {
				document,
				workspaceCode: context.access.workspace.code,
				canDelete: canManageMembers(context.access.role),
				canManageTags: canManageMembers(context.access.role),
			};
		} catch {
			throw notFound();
		}
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	notFoundComponent: () => (
		<PageNotFound
			title="Document not found"
			description="This document doesn't exist or you don't have access to it."
		/>
	),
	component: DocumentDetailPage,
});

function DocumentDetailPage() {
	const { document, workspaceCode, canDelete, canManageTags } =
		Route.useLoaderData();

	return (
		<div className="dashboard-page">
			<DocumentDetailForm
				workspaceCode={workspaceCode}
				canDelete={canDelete}
				canManageTags={canManageTags}
				document={document}
			/>
		</div>
	);
}
