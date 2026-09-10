import { z } from "zod";
import { parseIssueDateTime } from "#/lib/issue-datetime";
import { TAG_COLOR_IDS } from "./tag-colors";

const issueStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);

const issuePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

function createIssueDateTimeSchema(bound: "start" | "end") {
	return z.union([z.string(), z.null()]).transform((value, ctx) => {
		if (value == null || value.trim() === "") return null;
		const parsed = parseIssueDateTime(value, bound);
		if (!parsed) {
			ctx.addIssue({ code: "custom", message: "Invalid datetime" });
			return z.NEVER;
		}
		return parsed;
	});
}

export const issueStartDateTimeSchema = createIssueDateTimeSchema("start");
export const issueEndDateTimeSchema = createIssueDateTimeSchema("end");

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
	startDate: issueStartDateTimeSchema,
	endDate: issueEndDateTimeSchema,
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

export const tagColorSchema = z.enum(TAG_COLOR_IDS);

export const TAG_NAME_MAX = 50;

export const createTagSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(TAG_NAME_MAX),
	color: tagColorSchema.optional(),
});

export const updateTagSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "Name is required")
			.max(TAG_NAME_MAX)
			.optional(),
		color: tagColorSchema.optional(),
	})
	.refine((value) => value.name !== undefined || value.color !== undefined, {
		message: "No changes provided",
	});

export const commentBodySchema = z
	.string()
	.trim()
	.min(1, "Comment is required")
	.max(4000);

export const createCommentSchema = z.object({
	body: commentBodySchema,
});

export const updateCommentSchema = z.object({
	body: commentBodySchema,
});

export const ISSUE_SORT_FIELDS = [
	"number",
	"title",
	"status",
	"priority",
	"createdAt",
	"updatedAt",
	"startDate",
	"endDate",
] as const;

export const ISSUE_GRAPH_GROUP_BY = ["status", "priority", "tag"] as const;

export const ISSUE_BOARD_CARD_FIELDS = ["priority", "dates", "tags"] as const;

export const defaultBoardCardFields = ["priority", "tags"] as const;

export function normalizeBoardCardFields(fields: readonly string[]) {
	const selected = new Set(fields);
	return ISSUE_BOARD_CARD_FIELDS.filter((field) => selected.has(field));
}

export const issueViewConfigSchema = z.object({
	layout: z.enum(["list", "board", "gantt"]),
	filters: z.object({
		status: z.array(issueStatusSchema),
		priority: z.array(issuePrioritySchema),
		tag: z.array(z.string().min(1)),
	}),
	sort: z.object({
		field: z.enum(ISSUE_SORT_FIELDS),
		direction: z.enum(["asc", "desc"]),
	}),
	graph: z.object({
		visible: z.boolean(),
		groupBy: z.enum(ISSUE_GRAPH_GROUP_BY),
	}),
	board: z
		.object({
			card: z
				.array(z.enum(["priority", "status", "dates", "tags"]))
				.transform(normalizeBoardCardFields),
		})
		.default({ card: [...defaultBoardCardFields] }),
});

export const defaultIssueViewConfig = {
	layout: "list" as const,
	filters: { status: [], priority: [], tag: [] },
	sort: { field: "number" as const, direction: "desc" as const },
	graph: { visible: false, groupBy: "status" as const },
	board: { card: [...defaultBoardCardFields] },
};

export const issueViewNameSchema = z
	.string()
	.trim()
	.min(1, "Name is required")
	.max(80);

export const createIssueViewSchema = z.object({
	name: issueViewNameSchema,
	config: issueViewConfigSchema,
});

export const updateIssueViewSchema = z
	.object({
		name: issueViewNameSchema.optional(),
		config: issueViewConfigSchema.optional(),
	})
	.refine((value) => value.name !== undefined || value.config !== undefined, {
		message: "No changes provided",
	});

export type IssueViewConfig = z.infer<typeof issueViewConfigSchema>;
export type IssueSortField = (typeof ISSUE_SORT_FIELDS)[number];
export type IssueGraphGroupBy = (typeof ISSUE_GRAPH_GROUP_BY)[number];
export type IssueBoardCardField = (typeof ISSUE_BOARD_CARD_FIELDS)[number];
export type CreateIssueViewInput = z.infer<typeof createIssueViewSchema>;
export type UpdateIssueViewInput = z.infer<typeof updateIssueViewSchema>;

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
