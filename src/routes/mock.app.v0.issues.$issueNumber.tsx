import { createFileRoute, notFound } from "@tanstack/react-router";
import PageNotFound from "#/components/PageNotFound";
import MockIssueDetail from "#/mock/components/MockIssueDetail";
import { getMockIssue } from "#/mock/fixtures";

export const Route = createFileRoute("/mock/app/v0/issues/$issueNumber")({
	loader: ({ params }) => {
		const issueNumber = Number(params.issueNumber);
		if (!Number.isInteger(issueNumber) || !getMockIssue(issueNumber)) {
			throw notFound();
		}
		return { issueNumber };
	},
	notFoundComponent: () => (
		<PageNotFound
			title="Issue not found"
			description="This fixture issue doesn't exist."
		/>
	),
	component: MockIssueDetailPage,
});

function MockIssueDetailPage() {
	const { issueNumber } = Route.useLoaderData();
	return (
		<div className="dashboard-page">
			<MockIssueDetail issueNumber={issueNumber} />
		</div>
	);
}
