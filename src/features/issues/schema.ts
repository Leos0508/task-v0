import { z } from "zod";

const issueStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);

const issuePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const dateOnlySchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
	.nullable();

function hasOrderedDates(value: {
	startDate?: string | null;
	endDate?: string | null;
}) {
	if (!value.startDate || !value.endDate) return true;
	return value.startDate <= value.endDate;
}

const issueFormFields = z.object({
	title: z.string().min(1, "Title is required").max(200),
	status: issueStatusSchema,
	priority: issuePrioritySchema.nullable(),
	startDate: dateOnlySchema,
	endDate: dateOnlySchema,
	description: z.unknown(),
});

export const issueFormSchema = issueFormFields.refine(hasOrderedDates, {
	message: "End must be on or after start",
	path: ["endDate"],
});

export const updateIssueSchema = issueFormFields
	.partial()
	.refine(
		(value) =>
			value.title !== undefined ||
			value.status !== undefined ||
			value.priority !== undefined ||
			value.startDate !== undefined ||
			value.endDate !== undefined ||
			value.description !== undefined,
		{ message: "No changes provided" },
	)
	.refine(hasOrderedDates, {
		message: "End must be on or after start",
		path: ["endDate"],
	});

export const reorderIssueSchema = z
	.object({
		status: issueStatusSchema,
		targetIssueId: z.string().min(1).optional(),
		edge: z.enum(["top", "bottom"]).optional(),
	})
	.refine((value) => value.targetIssueId == null || value.edge != null, {
		message: "Drop edge is required when targeting an issue",
		path: ["edge"],
	});

export type IssueFormValues = z.infer<typeof issueFormFields>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type ReorderIssueInput = z.infer<typeof reorderIssueSchema>;
