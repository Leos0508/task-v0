import { Link, useNavigate } from "@tanstack/react-router";
import { CopyIcon, LinkIcon, MoreHorizontalIcon, TypeIcon } from "lucide-react";
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
import { Field } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import ChangeHistory from "#/features/history/components/ChangeHistory";
import { cn, formatDateTime } from "#/lib/utils";
import MockEditor from "#/mock/components/MockEditor";
import MockTagBadge from "#/mock/components/MockTagBadge";
import {
	getMockDocument,
	issuesForDocument,
	mockDocumentHistory,
} from "#/mock/fixtures";

const unstyledControl =
	"border-0 bg-transparent shadow-none outline-none ring-0 focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none dark:bg-transparent";

export default function MockDocumentDetail({
	documentId,
}: {
	documentId: string;
}) {
	const document = getMockDocument(documentId);
	const navigate = useNavigate();
	const [deleteOpen, setDeleteOpen] = useState(false);

	if (!document) return null;

	const linked = issuesForDocument(document);
	const history = mockDocumentHistory[document.id] ?? [];

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex items-center gap-4 border-b px-4 py-3">
				<div className="min-w-0 flex-1">
					<Breadcrumb className="text-sm">
						<BreadcrumbList className="flex-nowrap">
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to="/mock/app/v0/documents">Documents</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem className="min-w-0 flex-1 overflow-hidden">
								<BreadcrumbPage className="block min-w-0 font-medium line-clamp-1">
									{document.title}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<p className="mt-1 text-xs text-muted-foreground">
						Created {formatDateTime(document.createdAt)} · Last update{" "}
						{formatDateTime(document.updatedAt)}
					</p>
				</div>
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
							<DropdownMenuSubContent align="start">
								<DropdownMenuLabel>Copy options</DropdownMenuLabel>
								<DropdownMenuItem onSelect={() => toast.success("Link copied")}>
									<LinkIcon />
									URL
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={() => toast.success("Title copied")}
								>
									<TypeIcon />
									Title
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onSelect={() => setDeleteOpen(true)}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="detail-form-layout">
					<div className="detail-form-main">
						<Field>
							<Textarea
								defaultValue={document.title}
								placeholder="Document title"
								rows={1}
								className={cn(
									unstyledControl,
									"min-h-0 min-w-0 resize-none px-0 py-0 font-heading text-3xl font-semibold leading-tight md:text-2xl",
								)}
							/>
						</Field>
						<MockEditor>
							{document.body.map((section) => (
								<div key={section.heading}>
									<h2>{section.heading}</h2>
									{section.paragraphs.map((paragraph) => (
										<p key={paragraph}>{paragraph}</p>
									))}
									{section.bullets ? (
										<ul>
											{section.bullets.map((item) => (
												<li key={item}>{item}</li>
											))}
										</ul>
									) : null}
								</div>
							))}
						</MockEditor>
						<ChangeHistory entries={history} />
					</div>
					<aside className="detail-form-aside">
						<div className="flex flex-col gap-2">
							<p className="text-xs text-muted-foreground">Tags</p>
							<div className="flex flex-wrap gap-1">
								{document.tags.map((tag) => (
									<MockTagBadge key={tag.id} tag={tag} />
								))}
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="self-start"
								onClick={() => toast.message("Mock only — tags are static")}
							>
								+ Add tag
							</Button>
						</div>
						<div className="flex flex-col gap-2">
							<p className="text-xs text-muted-foreground">Linked issues</p>
							{linked.length === 0 ? (
								<p className="text-sm text-muted-foreground">None</p>
							) : (
								<ul className="flex flex-col gap-1">
									{linked.map((issue) => (
										<li key={issue.id}>
											<Link
												to="/mock/app/v0/issues/$issueNumber"
												params={{ issueNumber: String(issue.number) }}
												className="text-sm hover:underline"
											>
												TASK-{issue.number} {issue.title}
											</Link>
										</li>
									))}
								</ul>
							)}
						</div>
					</aside>
				</div>
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
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								toast.message("Mock only — document not deleted");
								navigate({ to: "/mock/app/v0/documents" });
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
