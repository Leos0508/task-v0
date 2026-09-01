import { useForm, useSelector } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	BookOpenIcon,
	CopyIcon,
	LinkIcon,
	MoreHorizontalIcon,
	NotebookPenIcon,
	TypeIcon,
} from "lucide-react";
import {
	type ComponentProps,
	lazy,
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
import { Field, FieldError } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import type { DocumentLinkedIssue } from "#/lib/data/fetch-document";
import {
	deleteDocumentFn,
	updateDocumentFn,
} from "#/lib/functions/documents.functions";
import { cn, formatDateTime } from "#/lib/utils";
import { documentPath } from "#/lib/workspace-path";
import { documentKeys } from "../queries";
import {
	type DocumentFormValues,
	documentFormSchema,
	emptyDocumentDescription,
} from "../schema";
import DocumentLinkedIssues from "./DocumentLinkedIssues";

const IssueEditorLazy = lazy(
	() => import("#/features/issues/components/IssueEditor"),
);

const editorFallback = (
	<div className="min-h-64 py-2 text-sm text-muted-foreground">
		Loading editor…
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
		<ClientOnly fallback={editorFallback}>
			<Suspense fallback={editorFallback}>
				<IssueEditorLazy {...props} />
			</Suspense>
		</ClientOnly>
	);
}

const unstyledControl =
	"border-0 bg-transparent shadow-none outline-none ring-0 focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none dark:bg-transparent";

type DocumentDetailFormProps = {
	workspaceCode: string;
	document: {
		id: string;
		title: string;
		description: unknown;
		createdAt: string;
		updatedAt: string;
		linkedIssues: DocumentLinkedIssue[];
	};
	canDelete: boolean;
};

function normalizeDescription(value: unknown) {
	if (value && typeof value === "object") return value;
	return emptyDocumentDescription;
}

export default function DocumentDetailForm({
	workspaceCode,
	document,
	canDelete,
}: DocumentDetailFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [mode, setMode] = useState<"edit" | "readonly">("readonly");
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [linkedIssues, setLinkedIssues] = useState(document.linkedIssues);
	const [updatedAt, setUpdatedAt] = useState(document.updatedAt);
	const [saveState, setSaveState] = useState<
		"idle" | "saving" | "saved" | "error"
	>("idle");
	const lastSaved = useRef<string | null>(null);

	const form = useForm({
		defaultValues: {
			title: document.title,
			description: normalizeDescription(document.description),
		} as DocumentFormValues,
		validators: {
			onChange: documentFormSchema,
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

		const parsed = documentFormSchema.safeParse(values);
		if (!parsed.success) return;

		const timeout = window.setTimeout(async () => {
			setSaveState("saving");
			const result = await updateDocumentFn({
				data: {
					workspaceCode,
					documentId: document.id,
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
			if (result.data?.updatedAt) {
				setUpdatedAt(result.data.updatedAt);
			}
			await queryClient.invalidateQueries({
				queryKey: documentKeys.all(workspaceCode),
			});
		}, 700);

		return () => window.clearTimeout(timeout);
	}, [document.id, queryClient, values, workspaceCode]);

	async function copyText(value: string, label: string) {
		await navigator.clipboard.writeText(value).catch(() => undefined);
		toast.success(`${label} copied`);
	}

	async function handleDelete() {
		const result = await deleteDocumentFn({
			data: { workspaceCode, documentId: document.id },
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}
		await queryClient.invalidateQueries({
			queryKey: documentKeys.all(workspaceCode),
		});
		toast.success("Document deleted");
		navigate({
			to: "/workspaces/$code/documents",
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
									<Link
										to="/workspaces/$code/documents"
										params={{ code: workspaceCode }}
									>
										Documents
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem className="min-w-0 flex-1 overflow-hidden">
								<BreadcrumbPage className="block min-w-0 line-clamp-1 font-medium">
									{title.trim() || "Untitled"}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<p className="mt-1 text-xs text-muted-foreground">
						Created {formatDateTime(document.createdAt)} · Last update{" "}
						{formatDateTime(updatedAt)}
					</p>
				</div>
				<div className="ml-auto flex shrink-0 items-center gap-1">
					<Button
						size="icon-sm"
						variant="ghost"
						className="hover:cursor-pointer"
						onClick={() =>
							setMode((mode) => (mode === "edit" ? "readonly" : "edit"))
						}
					>
						{mode === "readonly" ? (
							<BookOpenIcon className="h-4 w-4" />
						) : (
							<NotebookPenIcon className="h-4 w-4" />
						)}
					</Button>
					{saveState === "saving" ? (
						<span className="mr-2 text-xs text-muted-foreground">Saving…</span>
					) : saveState === "saved" ? (
						<span className="mr-2 text-xs text-muted-foreground">Saved</span>
					) : null}
					<HeaderMenu
						canDelete={canDelete}
						onCopyLink={() =>
							copyText(
								`${window.location.origin}${documentPath(workspaceCode, document.id)}`,
								"Link",
							)
						}
						onCopyTitle={() => copyText(title.trim() || "Untitled", "Title")}
						onDelete={() => setDeleteOpen(true)}
					/>
				</div>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<form
					className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_15rem] mx-auto max-w-6xl w-full"
					onSubmit={(event) => event.preventDefault()}
				>
					<div className="min-w-0 flex flex-col gap-4">
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
											placeholder="Document title"
											rows={1}
											readOnly={mode === "readonly"}
											className={cn(
												unstyledControl,
												"min-h-0 resize-none px-0 py-0 text-3xl font-heading font-semibold leading-tight md:text-2xl",
												mode === "readonly" && "cursor-default",
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
										placeholder="Start writing…"
										mode={mode}
									/>
								</Field>
							)}
						</form.Field>
					</div>

					<aside className="flex flex-col gap-8">
						<DocumentLinkedIssues
							workspaceCode={workspaceCode}
							documentId={document.id}
							linkedIssues={linkedIssues}
							onLinkedIssuesChange={setLinkedIssues}
						/>
					</aside>
				</form>
			</div>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this document?</AlertDialogTitle>
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
	onCopyTitle: () => void;
	onDelete: () => void;
};

function HeaderMenu({
	canDelete,
	onCopyLink,
	onCopyTitle,
	onDelete,
}: HeaderMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="ghost" size="icon">
					<MoreHorizontalIcon />
					<span className="sr-only">Document actions</span>
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
