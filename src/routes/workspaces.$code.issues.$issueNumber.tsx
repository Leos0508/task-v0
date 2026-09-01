import { createFileRoute, notFound } from "@tanstack/react-router";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import PageNotFound from "#/components/PageNotFound";
import IssueDetailForm from "#/features/issues/components/IssueDetailForm";
import { canManageMembers } from "#/lib/authz/roles";
import { getIssueFn } from "#/lib/functions/issues.functions";
import { parseIssueNumber } from "#/lib/workspace-path";

export const Route = createFileRoute("/workspaces/$code/issues/$issueNumber")({
	loader: async ({ context, params }) => {
		const issueNumber = parseIssueNumber(params.issueNumber);
		if (issueNumber == null) {
			throw notFound();
		}

		try {
			const issue = await getIssueFn({
				data: { code: params.code, issueNumber },
			});
			return {
				issue,
				workspaceCode: context.access.workspace.code,
				canDelete: canManageMembers(context.access.role),
			};
		} catch {
			throw notFound();
		}
	},
	pendingComponent: PageLoading,
	errorComponent: PageError,
	notFoundComponent: () => (
		<PageNotFound
			title="Issue not found"
			description="This issue doesn't exist or you don't have access to it."
		/>
	),
	component: IssueDetailPage,
});

function IssueDetailPage() {
	const { issue, workspaceCode, canDelete } = Route.useLoaderData();

	return (
		<div className="dashboard-page">
			<IssueDetailForm
				workspaceCode={workspaceCode}
				canDelete={canDelete}
				issue={{
					number: issue.number,
					title: issue.title,
					status: issue.status,
					priority: issue.priority,
					startDate: issue.startDate,
					endDate: issue.endDate,
					description: issue.description,
					reporterName: issue.reporter.name,
					linkedDocuments: issue.linkedDocuments,
				}}
			/>
		</div>
	);
}
