import {
	createFileRoute,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import { Separator } from "#/components/ui/separator";
import DocumentList from "#/features/documents/components/DocumentList";
import { documentsQueryOptions } from "#/features/documents/queries";
import {
	documentSearchDefaults,
	documentSearchSchema,
} from "#/features/documents/schema";
import { tagsQueryOptions } from "#/features/issues/queries";

export const Route = createFileRoute("/app/$code/documents/")({
	validateSearch: documentSearchSchema,
	search: {
		middlewares: [stripSearchParams(documentSearchDefaults)],
	},
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(documentsQueryOptions(params.code)),
			context.queryClient.ensureQueryData(tagsQueryOptions(params.code)),
		]);
		return { code: context.access.workspace.code };
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	component: DocumentsPage,
});

function DocumentsPage() {
	const { code } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

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
				<DocumentList
					workspaceCode={code}
					sort={search.sort}
					dir={search.dir}
					onSortChange={(next) =>
						navigate({
							search: (prev) => ({ ...prev, ...next }),
							replace: true,
						})
					}
				/>
			</div>
		</div>
	);
}
