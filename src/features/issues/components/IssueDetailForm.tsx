import { useForm, useSelector } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	CopyIcon,
	HashIcon,
	LinkIcon,
	MoreHorizontalIcon,
	TypeIcon,
} from "lucide-react";
import {
	type ComponentProps,
	type ReactNode,
	Suspense,
	useEffect,
	useRef,
	useState,
} from "react";
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
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import type { IssuePriority, IssueStatus } from "#/db/schema";
import type { IssueLinkedDocument } from "#/lib/data/fetch-issue";
import type { IssueTag } from "#/lib/data/fetch-tags";
import { uploadDescriptionImage } from "#/lib/functions/files.functions";
import { deleteIssueFn, updateIssueFn } from "#/lib/functions/issues.functions";
import { lazyImport } from "#/lib/stale-dynamic-import";
import { cn } from "#/lib/utils";
import { issueCode as formatIssueCode, issuePath } from "#/lib/workspace-path";
import { issueKeys } from "../queries";
import { type IssueFormValues, issueFormSchema } from "../schema";
import {
	PRIORITIES,
	PriorityBadge,
	STATUSES,
	StatusBadge,
} from "./IssueBadges";
import IssueComments from "./IssueComments";
import IssueLinkedDocuments from "./IssueLinkedDocuments";
import IssueTags from "./IssueTags";

const IssueEditorLazy = lazyImport(() => import("./IssueEditor"));

const editorFallback = (
	<div className="tiptap-editor text-sm text-muted-foreground">
		<span className="sr-only">Loading editor</span>
	</div>
);

function ClientOnly({
	children,
	fallback,
}: {
	children: ReactNode;
	fallback: ReactNode;
}) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);
	if (!mounted) return fallback;
	return children;
}

function IssueEditor(props: ComponentProps<typeof IssueEditorLazy>) {
	return (
		<div className="min-h-64 min-w-0 w-full" style={{ minHeight: "16rem" }}>
			<ClientOnly fallback={editorFallback}>
				<Suspense fallback={editorFallback}>
					<IssueEditorLazy {...props} />
				</Suspense>
			</ClientOnly>
		</div>
	);
}

const unstyledControl =
	"border-0 bg-transparent shadow-none outline-none ring-0 focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none dark:bg-transparent";

type IssueDetailFormProps = {
	workspaceCode: string;
	issue: {
		number: number;
		title: string;
		status: IssueStatus;
		priority: IssuePriority | null;
		startDate: string | null;
		endDate: string | null;
		description: unknown;
		reporterName: string;
		linkedDocuments: IssueLinkedDocument[];
		tags: IssueTag[];
	};
	canDelete: boolean;
	currentUserId: string;
	canModerate: boolean;
};

export default function IssueDetailForm({
	workspaceCode,
	issue,
	canDelete,
	currentUserId,
	canModerate,
}: IssueDetailFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [linkedDocuments, setLinkedDocuments] = useState(issue.linkedDocuments);
	const [tags, setTags] = useState(issue.tags);
	const [saveState, setSaveState] = useState<
		"idle" | "saving" | "saved" | "error"
	>("idle");
	const lastSaved = useRef<string | null>(null);
	const code = formatIssueCode(workspaceCode, issue.number);

	const form = useForm({
		defaultValues: {
			title: issue.title,
			status: issue.status,
			priority: issue.priority,
			startDate: issue.startDate,
			endDate: issue.endDate,
			description: issue.description ?? {
				type: "doc",
				content: [{ type: "paragraph" }],
			},
		} as IssueFormValues,
		validators: {
			onChange: issueFormSchema,
		},
	});

	const values = useSelector(form.store, (state) => state.values);
	const title = values.title;

	useEffect(() => {
		const serialized = JSON.stringify(values);
		if (lastSaved.current == null) {
			lastSaved.current = serialized;
			return;
		}
		if (serialized === lastSaved.current) return;

		const parsed = issueFormSchema.safeParse(values);
		if (!parsed.success) return;

		const timeout = window.setTimeout(async () => {
			setSaveState("saving");
			const result = await updateIssueFn({
				data: {
					workspaceCode,
					issueNumber: issue.number,
					input: parsed.data,
				},
			});
			if (!result.success) {
				setSaveState("error");
				toast.error(result.error.message);
				return;
			}

			lastSaved.current = serialized;
			setSaveState("saved");
			await queryClient.invalidateQueries({
				queryKey: issueKeys.all(workspaceCode),
			});
		}, 700);

		return () => window.clearTimeout(timeout);
	}, [issue.number, queryClient, values, workspaceCode]);

	async function copyText(value: string, label: string) {
		await navigator.clipboard.writeText(value).catch(() => undefined);
		toast.success(`${label} copied`);
	}

	async function handleDelete() {
		const result = await deleteIssueFn({
			data: { workspaceCode, issueNumber: issue.number },
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}
		await queryClient.invalidateQueries({
			queryKey: issueKeys.all(workspaceCode),
		});
		toast.success("Issue deleted");
		navigate({
			to: "/app/$code/issues",
			params: { code: workspaceCode },
		});
	}

	return (
		<div className="flex min-h-0 h-full flex-col">
			<header className="flex items-center gap-4 border-b px-4 py-3">
				<div className="min-w-0 flex-1">
					<Breadcrumb className="text-sm">
						<BreadcrumbList className="flex-nowrap">
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to="/app/$code/issues" params={{ code: workspaceCode }}>
										Issues
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem className="min-w-0 flex-1 overflow-hidden">
								<BreadcrumbPage className="block min-w-0 line-clamp-1 font-medium">
									<span className="text-muted-foreground mr-1">{code}</span>{" "}
									{title.trim() || "Untitled"}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<p className="mt-1 text-xs text-muted-foreground">
						Reported by {issue.reporterName}
					</p>
				</div>
				<div className="ml-auto flex shrink-0 items-center gap-1">
					{saveState === "saving" ? (
						<span className="mr-2 text-xs text-muted-foreground">Saving…</span>
					) : saveState === "saved" ? (
						<span className="mr-2 text-xs text-muted-foreground">Saved</span>
					) : null}
					<HeaderMenu
						canDelete={canDelete}
						onCopyLink={() =>
							copyText(
								`${window.location.origin}${issuePath(workspaceCode, issue.number)}`,
								"Link",
							)
						}
						onCopyCode={() => copyText(code, "Code")}
						onCopyTitle={() => copyText(title.trim() || "Untitled", "Title")}
						onDelete={() => setDeleteOpen(true)}
					/>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<div
					className="detail-form-layout"
					style={{
						display: "grid",
						gridTemplateColumns: "minmax(0, 1fr) 15rem",
						alignItems: "start",
						gap: "2rem",
						width: "100%",
						maxWidth: "72rem",
						marginInline: "auto",
						padding: "2rem 1.5rem",
					}}
				>
					<div className="detail-form-main">
						<form.Field name="title">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<Textarea
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											onKeyDown={(event) => {
												if (event.key === "Enter") {
													event.preventDefault();
												}
											}}
											placeholder="Issue title"
											rows={1}
											className={cn(
												unstyledControl,
												"min-h-0 min-w-0 resize-none px-0 py-0 text-3xl font-heading font-semibold leading-tight md:text-2xl",
											)}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="description">
							{(field) => (
								<Field>
									<IssueEditor
										value={field.state.value}
										onChange={field.handleChange}
										onUploadImage={(file) =>
											uploadDescriptionImage(workspaceCode, file)
										}
									/>
								</Field>
							)}
						</form.Field>
						<IssueComments
							workspaceCode={workspaceCode}
							issueNumber={issue.number}
							currentUserId={currentUserId}
							canModerate={canModerate}
						/>
					</div>

					<aside className="detail-form-aside">
						<form.Field name="status">
							{(field) => (
								<Field>
									<FieldLabel className="text-xs text-muted-foreground">
										Status
									</FieldLabel>
									<Select
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(value as IssueStatus)
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue>
												<StatusBadge status={field.state.value} />
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{STATUSES.map((status) => (
												<SelectItem key={status} value={status}>
													<StatusBadge status={status} />
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							)}
						</form.Field>
						<form.Field name="priority">
							{(field) => (
								<Field>
									<FieldLabel className="text-xs text-muted-foreground">
										Priority
									</FieldLabel>
									<Select
										value={field.state.value ?? "none"}
										onValueChange={(value) =>
											field.handleChange(
												value === "none" ? null : (value as IssuePriority),
											)
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue>
												<PriorityBadge priority={field.state.value} />
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{PRIORITIES.map((priority) => (
												<SelectItem
													key={priority ?? "none"}
													value={priority ?? "none"}
												>
													<PriorityBadge priority={priority} />
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							)}
						</form.Field>
						<form.Field name="startDate">
							{(field) => (
								<Field>
									<FieldLabel className="text-xs text-muted-foreground">
										Start
									</FieldLabel>
									<Input
										type="date"
										value={field.state.value ?? ""}
										onChange={(event) =>
											field.handleChange(event.target.value || null)
										}
									/>
								</Field>
							)}
						</form.Field>
						<form.Field name="endDate">
							{(field) => {
								const isInvalid = !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel className="text-xs text-muted-foreground">
											End
										</FieldLabel>
										<Input
											type="date"
											value={field.state.value ?? ""}
											onChange={(event) =>
												field.handleChange(event.target.value || null)
											}
										/>
										{isInvalid ? (
											<FieldError errors={field.state.meta.errors} />
										) : null}
									</Field>
								);
							}}
						</form.Field>
						<IssueTags
							workspaceCode={workspaceCode}
							issueNumber={issue.number}
							tags={tags}
							canManageTags={canModerate}
							onTagsChange={setTags}
						/>
						<IssueLinkedDocuments
							workspaceCode={workspaceCode}
							issueNumber={issue.number}
							linkedDocuments={linkedDocuments}
							onLinkedDocumentsChange={setLinkedDocuments}
						/>
					</aside>
				</div>
			</div>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this issue?</AlertDialogTitle>
						<AlertDialogDescription>
							This cannot be undone.
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

type HeaderMenuProps = {
	canDelete: boolean;
	onCopyLink: () => void;
	onCopyCode: () => void;
	onCopyTitle: () => void;
	onDelete: () => void;
};

function HeaderMenu({
	canDelete,
	onCopyLink,
	onCopyCode,
	onCopyTitle,
	onDelete,
}: HeaderMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="ghost" size="icon">
					<MoreHorizontalIcon />
					<span className="sr-only">Issue actions</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40 min-w-40">
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<CopyIcon />
						Copy
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent
						align="start"
						onPointerDown={(event) => event.stopPropagation()}
						onClick={(event) => event.stopPropagation()}
					>
						<DropdownMenuLabel>Copy options</DropdownMenuLabel>
						<DropdownMenuItem onSelect={onCopyLink}>
							<LinkIcon />
							URL
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={onCopyCode}>
							<HashIcon />
							Code
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={onCopyTitle}>
							<TypeIcon />
							Title
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				{canDelete && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onSelect={onDelete}>
							Delete
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
