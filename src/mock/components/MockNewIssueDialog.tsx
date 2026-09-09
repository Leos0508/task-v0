import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Field, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";

export default function MockNewIssueDialog({
	trigger,
}: {
	trigger: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("");
	const navigate = useNavigate();

	function handleCreate() {
		toast.message("Mock only — opened a fixture issue");
		setOpen(false);
		setTitle("");
		navigate({
			to: "/mock/app/v0/issues/$issueNumber",
			params: { issueNumber: "1" },
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="font-heading text-2xl">New issue</DialogTitle>
					<DialogDescription>
						Capture work that belongs in this workspace.
					</DialogDescription>
				</DialogHeader>
				<Field>
					<FieldLabel htmlFor="mock-issue-title">Title</FieldLabel>
					<Input
						id="mock-issue-title"
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="What needs to happen?"
						className="rounded-full"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="mock-issue-body">Description</FieldLabel>
					<Textarea
						id="mock-issue-body"
						placeholder="Context, acceptance notes, linked docs..."
						rows={5}
					/>
				</Field>
				<DialogFooter>
					<Button
						type="button"
						variant="secondary"
						onClick={() => setOpen(false)}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleCreate}>
						Create issue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
