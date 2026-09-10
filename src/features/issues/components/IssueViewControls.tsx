import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EllipsisIcon } from "lucide-react";
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
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { WorkspaceRole } from "#/db/schema";
import IssueSaveViewDialog from "#/features/issues/components/IssueSaveViewDialog";
import {
	issueViewKeys,
	issueViewsQueryOptions,
} from "#/features/issues/queries";
import {
	type IssueViewSearch,
	issueSearchDefaults,
	isViewSearchDirty,
	searchFromViewConfig,
	viewConfigFromSearch,
} from "#/features/issues/view-search";
import { canManageIssueView } from "#/lib/authz/roles";
import {
	createIssueViewFn,
	deleteIssueViewFn,
	updateIssueViewFn,
} from "#/lib/functions/issue-views.functions";

const ALL_ISSUES = "all";

export default function IssueViewControls({
	workspaceCode,
	userId,
	role,
	search,
	onSearchChange,
}: {
	workspaceCode: string;
	userId: string;
	role: WorkspaceRole;
	search: IssueViewSearch;
	onSearchChange: (search: IssueViewSearch) => void;
}) {
	const queryClient = useQueryClient();
	const { data: views = [] } = useQuery(issueViewsQueryOptions(workspaceCode));
	const [dialog, setDialog] = useState<"save" | "rename" | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const activeView = views.find((view) => view.id === search.viewId);
	const canManage = activeView
		? canManageIssueView(role, activeView.createdById, userId)
		: false;
	const dirty = activeView
		? isViewSearchDirty(search, activeView.config)
		: false;

	async function invalidateViews() {
		await queryClient.invalidateQueries({
			queryKey: issueViewKeys.all(workspaceCode),
		});
	}

	async function handleCreate(name: string) {
		const result = await createIssueViewFn({
			data: {
				workspaceCode,
				input: { name, config: viewConfigFromSearch(search) },
			},
		});
		if (!result.success || result.data == null) {
			toast.error(
				result.success ? "Failed to create view" : result.error.message,
			);
			return;
		}
		await invalidateViews();
		onSearchChange(searchFromViewConfig(result.data.id, result.data.config));
		setDialog(null);
		toast.success("View saved");
	}

	async function handleRename(name: string) {
		if (!activeView) return;
		const result = await updateIssueViewFn({
			data: {
				workspaceCode,
				viewId: activeView.id,
				input: { name },
			},
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}
		await invalidateViews();
		setDialog(null);
		toast.success("View renamed");
	}

	async function handleUpdate() {
		if (!activeView) return;
		const result = await updateIssueViewFn({
			data: {
				workspaceCode,
				viewId: activeView.id,
				input: { config: viewConfigFromSearch(search) },
			},
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}
		await invalidateViews();
		toast.success("View updated");
	}

	async function handleDelete() {
		if (!activeView) return;
		const result = await deleteIssueViewFn({
			data: { workspaceCode, viewId: activeView.id },
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}
		await invalidateViews();
		onSearchChange({ ...search, viewId: undefined });
		setDeleteOpen(false);
		toast.success("View deleted");
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Select
				value={activeView?.id ?? ALL_ISSUES}
				onValueChange={(value) => {
					if (value === ALL_ISSUES) {
						onSearchChange(issueSearchDefaults);
						return;
					}
					const next = views.find((view) => view.id === value);
					if (!next) return;
					onSearchChange(searchFromViewConfig(next.id, next.config));
				}}
			>
				<SelectTrigger aria-label="Issue view" className="min-w-40">
					<SelectValue placeholder="All issues" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_ISSUES}>All issues</SelectItem>
					{views.map((view) => (
						<SelectItem key={view.id} value={view.id}>
							{view.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{dirty ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						if (!activeView) return;
						onSearchChange(
							searchFromViewConfig(activeView.id, activeView.config),
						);
					}}
				>
					Reset
				</Button>
			) : null}
			{dirty && canManage ? (
				<Button type="button" size="sm" onClick={handleUpdate}>
					Update view
				</Button>
			) : null}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						aria-label="View actions"
					>
						<EllipsisIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={() => setDialog("save")}>
						Save as new
					</DropdownMenuItem>
					{activeView && canManage ? (
						<>
							<DropdownMenuItem onSelect={() => setDialog("rename")}>
								Rename
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant="destructive"
								onSelect={() => setDeleteOpen(true)}
							>
								Delete
							</DropdownMenuItem>
						</>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>
			<IssueSaveViewDialog
				key={dialog ?? "closed"}
				open={dialog != null}
				onOpenChange={(open) => {
					if (!open) setDialog(null);
				}}
				title={dialog === "rename" ? "Rename view" : "Save view"}
				description={
					dialog === "rename"
						? "Change the name of this workspace view."
						: "Save the current filters, sort, layout, and graph as a named view."
				}
				initialName={dialog === "rename" ? (activeView?.name ?? "") : ""}
				submitLabel={dialog === "rename" ? "Rename" : "Save"}
				onSubmit={dialog === "rename" ? handleRename : handleCreate}
			/>
			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete {activeView?.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							This named view will be removed for everyone in the workspace.
							Your current filters stay in the URL.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={handleDelete}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
