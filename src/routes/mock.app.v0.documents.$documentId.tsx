import { createFileRoute, notFound } from "@tanstack/react-router";
import PageNotFound from "#/components/PageNotFound";
import MockDocumentDetail from "#/mock/components/MockDocumentDetail";
import { getMockDocument } from "#/mock/fixtures";

export const Route = createFileRoute("/mock/app/v0/documents/$documentId")({
	loader: ({ params }) => {
		const document = getMockDocument(params.documentId);
		if (!document) throw notFound();
		return { documentId: params.documentId };
	},
	notFoundComponent: () => (
		<PageNotFound
			title="Document not found"
			description="This fixture document doesn't exist."
		/>
	),
	component: MockDocumentDetailPage,
});

function MockDocumentDetailPage() {
	const { documentId } = Route.useLoaderData();
	return (
		<div className="dashboard-page">
			<MockDocumentDetail documentId={documentId} />
		</div>
	);
}
