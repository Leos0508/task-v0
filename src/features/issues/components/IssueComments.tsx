import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Field, FieldError } from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import {
	commentKeys,
	issueCommentsQueryOptions,
} from "#/features/issues/queries";
import {
	type CreateCommentInput,
	createCommentSchema,
} from "#/features/issues/schema";
import type { IssueComment } from "#/lib/data/fetch-issue-comments";
import {
	createCommentFn,
	deleteCommentFn,
	updateCommentFn,
} from "#/lib/functions/comments.functions";
import { formatDateTime, formatRelativeTime } from "#/lib/utils";

type IssueCommentsProps = {
	workspaceCode: string;
	issueNumber: number;
	currentUserId: string;
	canModerate: boolean;
};

export default function IssueComments({
	workspaceCode,
	issueNumber,
	currentUserId,
	canModerate,
}: IssueCommentsProps) {
	const queryClient = useQueryClient();
	const { data: comments = [] } = useQuery(
		issueCommentsQueryOptions(workspaceCode, issueNumber),
	);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

	async function invalidate() {
		await queryClient.invalidateQueries({
			queryKey: commentKeys.byIssue(workspaceCode, issueNumber),
		});
	}

	const form = useForm({
		defaultValues: { body: "" } as CreateCommentInput,
		validators: { onSubmit: createCommentSchema },
		onSubmit: async ({ value }) => {
			const result = await createCommentFn({
				data: {
					workspaceCode,
					issueNumber,
					input: value,
				},
			});
			if (!result.success) {
				toast.error(result.error.message);
				return;
			}
			form.reset();
			await invalidate();
		},
	});

	async function handleDelete(commentId: string) {
		const result = await deleteCommentFn({
			data: { workspaceCode, issueNumber, commentId },
		});
		if (!result.success) {
			toast.error(result.error.message);
			return;
		}
		setPendingDeleteId(null);
		await invalidate();
	}

	return (
		<section className="flex flex-col gap-4">
			<h2 className="text-sm font-medium">
				Comments
				{comments.length > 0 ? (
					<span className="ml-1 text-muted-foreground">
						({comments.length})
					</span>
				) : null}
			</h2>
			{comments.length === 0 ? (
				<p className="text-sm text-muted-foreground">No comments yet</p>
			) : (
				<ul className="flex flex-col gap-4">
					{comments.map((comment) => (
						<CommentItem
							key={comment.id}
							comment={comment}
							canEdit={comment.author.id === currentUserId}
							canDelete={comment.author.id === currentUserId || canModerate}
							onEdit={async (body) => {
								const result = await updateCommentFn({
									data: {
										workspaceCode,
										issueNumber,
										commentId: comment.id,
										input: { body },
									},
								});
								if (!result.success) {
									toast.error(result.error.message);
									return false;
								}
								await invalidate();
								return true;
							}}
							onDelete={() => setPendingDeleteId(comment.id)}
						/>
					))}
				</ul>
			)}
			<form
				className="flex flex-col gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name="body">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<Textarea
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Leave a comment"
									rows={3}
								/>
								{isInvalid ? (
									<FieldError errors={field.state.meta.errors} />
								) : null}
							</Field>
						);
					}}
				</form.Field>
				<div className="flex justify-end">
					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<Button type="submit" disabled={isSubmitting}>
								Comment
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
			<AlertDialog
				open={pendingDeleteId != null}
				onOpenChange={(open) => {
					if (!open) setPendingDeleteId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this comment?</AlertDialogTitle>
						<AlertDialogDescription>
							This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								if (pendingDeleteId) void handleDelete(pendingDeleteId);
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}

function CommentItem({
	comment,
	canEdit,
	canDelete,
	onEdit,
	onDelete,
}: {
	comment: IssueComment;
	canEdit: boolean;
	canDelete: boolean;
	onEdit: (body: string) => Promise<boolean>;
	onDelete: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const initials = comment.author.name
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

	const editForm = useForm({
		defaultValues: { body: comment.body } as CreateCommentInput,
		validators: { onSubmit: createCommentSchema },
		onSubmit: async ({ value }) => {
			const saved = await onEdit(value.body);
			if (saved) setEditing(false);
		},
	});

	return (
		<li className="flex gap-3">
			<Avatar size="sm">
				{comment.author.image ? (
					<AvatarImage src={comment.author.image} alt="" />
				) : null}
				<AvatarFallback>{initials || "?"}</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
					<p className="text-sm font-medium">{comment.author.name}</p>
					<time
						className="text-xs text-muted-foreground"
						dateTime={comment.createdAt}
						title={formatDateTime(comment.createdAt)}
					>
						{formatRelativeTime(comment.createdAt)}
					</time>
					{comment.updatedAt !== comment.createdAt ? (
						<span className="text-xs text-muted-foreground">edited</span>
					) : null}
				</div>
				{editing ? (
					<form
						className="mt-2 flex flex-col gap-2"
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							void editForm.handleSubmit();
						}}
					>
						<editForm.Field name="body">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<Textarea
											id={`${comment.id}-body`}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											rows={3}
										/>
										{isInvalid ? (
											<FieldError errors={field.state.meta.errors} />
										) : null}
									</Field>
								);
							}}
						</editForm.Field>
						<div className="flex gap-2">
							<Button type="submit" size="sm">
								Save
							</Button>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => {
									editForm.reset();
									setEditing(false);
								}}
							>
								Cancel
							</Button>
						</div>
					</form>
				) : (
					<p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
				)}
				{!editing && (canEdit || canDelete) ? (
					<div className="mt-1 flex gap-2">
						{canEdit ? (
							<Button
								type="button"
								variant="ghost"
								size="xs"
								onClick={() => setEditing(true)}
							>
								Edit
							</Button>
						) : null}
						{canDelete ? (
							<Button
								type="button"
								variant="ghost"
								size="xs"
								onClick={onDelete}
							>
								Delete
							</Button>
						) : null}
					</div>
				) : null}
			</div>
		</li>
	);
}
