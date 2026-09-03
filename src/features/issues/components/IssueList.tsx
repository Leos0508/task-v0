import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import PageLoading from "#/components/PageLoading";
import { Button } from "#/components/ui/button";
import { DataTable } from "#/components/ui/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { IssueStatus } from "#/db/schema";
import { createIssueColumns } from "#/features/issues/components/issue-columns";
import { issueKeys, issuesQueryOptions } from "#/features/issues/queries";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import { useAppTable } from "#/lib/data-table";
import { createIssueFn } from "#/lib/functions/issues.functions";

const EMPTY_ISSUES: IssueListItem[] = [];

function getIssueRowId(row: IssueListItem) {
	return row.id;
}

export default function IssueList({
	workspaceCode,
}: {
	workspaceCode: string;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: issues } = useQuery(issuesQueryOptions(workspaceCode));
	const [isCreating, startCreate] = useTransition();

	const columns = useMemo(
		() => createIssueColumns(workspaceCode),
		[workspaceCode],
	);

	const table = useAppTable({
		columns,
		data: issues ?? EMPTY_ISSUES,
		getRowId: getIssueRowId,
	});

	function handleNewIssue() {
		if (isCreating) return;
		startCreate(async () => {
			const result = await createIssueFn({
				data: { workspaceCode },
			});
			if (!result.success || result.data?.number == null) {
				toast.error(
					result.success ? "Failed to create issue" : result.error.message,
				);
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: issueKeys.all(workspaceCode),
			});
			navigate({
				to: "/app/$code/issues/$issueNumber",
				params: {
					code: workspaceCode,
					issueNumber: String(result.data.number),
				},
			});
		});
	}

	if (issues === undefined) return <PageLoading />;

	const counts = { total: issues.length, todo: 0, inProgress: 0, done: 0 };
	for (const issue of issues) {
		if (issue.status === "TODO") counts.todo += 1;
		else if (issue.status === "IN_PROGRESS") counts.inProgress += 1;
		else if (issue.status === "DONE") counts.done += 1;
	}

	const statusFilter =
		(table.getColumn("status")?.getFilterValue() as IssueStatus | undefined) ??
		"ALL";

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="grid gap-3 sm:grid-cols-4">
				<div className="rounded-lg border p-3">
					<p className="text-xs text-muted-foreground">Total</p>
					<p className="text-lg font-semibold">{counts.total}</p>
				</div>
				<div className="rounded-lg border p-3">
					<p className="text-xs text-muted-foreground">Todo</p>
					<p className="text-lg font-semibold">{counts.todo}</p>
				</div>
				<div className="rounded-lg border p-3">
					<p className="text-xs text-muted-foreground">In progress</p>
					<p className="text-lg font-semibold">{counts.inProgress}</p>
				</div>
				<div className="rounded-lg border p-3">
					<p className="text-xs text-muted-foreground">Done</p>
					<p className="text-lg font-semibold">{counts.done}</p>
				</div>
			</div>
			<div className="flex items-center justify-between gap-4">
				<Select
					value={statusFilter}
					onValueChange={(value) =>
						table
							.getColumn("status")
							?.setFilterValue(value === "ALL" ? undefined : value)
					}
				>
					<SelectTrigger className="w-44">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="ALL">All statuses</SelectItem>
						<SelectItem value="TODO">Todo</SelectItem>
						<SelectItem value="IN_PROGRESS">In progress</SelectItem>
						<SelectItem value="DONE">Done</SelectItem>
						<SelectItem value="CANCELLED">Cancelled</SelectItem>
					</SelectContent>
				</Select>
				<Button onClick={handleNewIssue} disabled={isCreating}>
					{isCreating ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						<PlusIcon />
					)}
					New issue
				</Button>
			</div>
			<DataTable
				table={table}
				emptyMessage="No issues yet. Create one to get started."
			/>
		</div>
	);
}
