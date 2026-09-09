import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "#/components/ui/separator";
import MockDocumentList from "#/mock/components/MockDocumentList";

export const Route = createFileRoute("/mock/app/v0/documents/")({
	component: MockDocumentsPage,
});

function MockDocumentsPage() {
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
				<MockDocumentList />
			</div>
		</div>
	);
}
