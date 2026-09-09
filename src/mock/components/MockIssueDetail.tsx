import { Link, useNavigate } from "@tanstack/react-router";
import {
	CopyIcon,
	HashIcon,
	LinkIcon,
	MoreHorizontalIcon,
	TypeIcon,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
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
import { Field, FieldLabel } from "#/components/ui/field";
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
import ChangeHistory from "#/features/history/components/ChangeHistory";
import {
	PRIORITIES,
	PriorityBadge,
	STATUSES,
	StatusBadge,
} from "#/features/issues/components/IssueBadges";
import { cn, formatRelativeTime } from "#/lib/utils";
import MockEditor from "#/mock/components/MockEditor";
import MockTagBadge from "#/mock/components/MockTagBadge";
import {
	documentsForIssue,
	getMockIssue,
	MOCK_WORKSPACE_CODE,
	mockCommentsByIssue,
	mockIssueHistory,
} from "#/mock/fixtures";

const unstyledControl =
	"border-0 bg-transparent shadow-none outline-none ring-0 focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-none dark:bg-transparent";

export default function MockIssueDetail({
	issueNumber,
}: {
	issueNumber: number;
}) {
	const issue = getMockIssue(issueNumber);
	const navigate = useNavigate();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [status, setStatus] = useState<IssueStatus>(issue?.status ?? "TODO");
	const [priority, setPriority] = useState<IssuePriority | null>(
		issue?.priority ?? null,
	);
	const [comment, setComment] = useState("");

	if (!issue) return null;

	const linked = documentsForIssue(issue);
	const comments = mockCommentsByIssue[issue.number] ?? [];
	const history = mockIssueHistory[issue.number] ?? [];
	const code = `${MOCK_WORKSPACE_CODE.toUpperCase()}-${issue.number}`;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex items-center gap-4 border-b px-4 py-3">
				<div className="min-w-0 flex-1">
					<Breadcrumb className="text-sm">
						<BreadcrumbList className="flex-nowrap">
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to="/mock/app/v0/issues">Issues</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem className="min-w-0 flex-1 overflow-hidden">
								<BreadcrumbPage className="block min-w-0 font-medium line-clamp-1">
									<span className="mr-1 text-muted-foreground">{code}</span>{" "}
									{issue.title}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<p className="mt-1 text-xs text-muted-foreground">
						Reported by {issue.reporterName}
					</p>
				</div>
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
							<DropdownMenuSubContent align="start">
								<DropdownMenuLabel>Copy options</DropdownMenuLabel>
								<DropdownMenuItem onSelect={() => toast.success("Link copied")}>
									<LinkIcon />
									URL
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => toast.success("Code copied")}>
									<HashIcon />
									Code
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
								defaultValue={issue.title}
								placeholder="Issue title"
								rows={1}
								className={cn(
									unstyledControl,
									"min-h-0 min-w-0 resize-none px-0 py-0 font-heading text-3xl font-semibold leading-tight md:text-2xl",
								)}
							/>
						</Field>
						<MockEditor>
							<p>{issue.description}</p>
						</MockEditor>
						<ChangeHistory entries={history} />
						<section className="flex flex-col gap-4">
							<h2 className="text-sm font-medium">
								Comments
								{comments.length > 0 ? (
									<span className="ml-1 text-muted-foreground">
										({comments.length})
									</span>
								) : null}
							</h2>
							<ul className="flex flex-col gap-3">
								{comments.map((entry) => (
									<li key={entry.id} className="flex gap-3">
										<Avatar>
											<AvatarFallback>
												{entry.author.name.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm font-medium">
												{entry.author.name}{" "}
												<span className="font-normal text-muted-foreground">
													{formatRelativeTime(entry.createdAt)}
												</span>
											</p>
											<p className="text-sm">{entry.body}</p>
										</div>
									</li>
								))}
							</ul>
							<Field>
								<Textarea
									value={comment}
									onChange={(event) => setComment(event.target.value)}
									placeholder="Leave a comment"
									rows={3}
								/>
							</Field>
							<Button
								type="button"
								className="self-start"
								onClick={() => {
									toast.message("Mock only — comment not saved");
									setComment("");
								}}
							>
								Comment
							</Button>
						</section>
					</div>
					<aside className="detail-form-aside">
						<Field>
							<FieldLabel className="text-xs text-muted-foreground">
								Status
							</FieldLabel>
							<Select
								value={status}
								onValueChange={(value) => setStatus(value as IssueStatus)}
							>
								<SelectTrigger className="w-full">
									<SelectValue>
										<StatusBadge status={status} />
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{STATUSES.map((item) => (
										<SelectItem key={item} value={item}>
											<StatusBadge status={item} />
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<Field>
							<FieldLabel className="text-xs text-muted-foreground">
								Priority
							</FieldLabel>
							<Select
								value={priority ?? "none"}
								onValueChange={(value) =>
									setPriority(
										value === "none" ? null : (value as IssuePriority),
									)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue>
										<PriorityBadge priority={priority} />
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{PRIORITIES.map((item) => (
										<SelectItem key={item ?? "none"} value={item ?? "none"}>
											<PriorityBadge priority={item} />
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<Field>
							<FieldLabel className="text-xs text-muted-foreground">
								Start
							</FieldLabel>
							<Input
								type="datetime-local"
								defaultValue={issue.startDate?.slice(0, 16) ?? ""}
							/>
						</Field>
						<Field>
							<FieldLabel className="text-xs text-muted-foreground">
								End
							</FieldLabel>
							<Input
								type="datetime-local"
								defaultValue={issue.endDate?.slice(0, 16) ?? ""}
							/>
						</Field>
						<div className="flex flex-col gap-2">
							<p className="text-xs text-muted-foreground">Tags</p>
							<div className="flex flex-wrap gap-1">
								{issue.tags.map((tag) => (
									<MockTagBadge key={tag.id} tag={tag} />
								))}
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<p className="text-xs text-muted-foreground">Linked documents</p>
							{linked.length === 0 ? (
								<p className="text-sm text-muted-foreground">None</p>
							) : (
								<ul className="flex flex-col gap-1">
									{linked.map((document) => (
										<li key={document.id}>
											<Link
												to="/mock/app/v0/documents/$documentId"
												params={{ documentId: document.slug }}
												className="text-sm hover:underline"
											>
												{document.title}
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
						<AlertDialogTitle>Delete this issue?</AlertDialogTitle>
						<AlertDialogDescription>
							This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								toast.message("Mock only — issue not deleted");
								navigate({ to: "/mock/app/v0/issues" });
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
