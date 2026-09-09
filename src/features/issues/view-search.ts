import { z } from "zod";
import type { IssuePriority, IssueStatus } from "#/db/schema";

export const ISSUE_VIEWS = ["list", "board", "gantt"] as const;

export type IssueView = (typeof ISSUE_VIEWS)[number];

const ISSUE_STATUS_VALUES = [
	"TODO",
	"IN_PROGRESS",
	"DONE",
	"CANCELLED",
] as const satisfies readonly IssueStatus[];

const ISSUE_PRIORITY_VALUES = [
	"LOW",
	"MEDIUM",
	"HIGH",
	"URGENT",
] as const satisfies readonly IssuePriority[];

export const issueViewSearchSchema = z.object({
	view: z.enum(ISSUE_VIEWS).default("list").catch("list"),
	status: z.array(z.enum(ISSUE_STATUS_VALUES)).default([]).catch([]),
	priority: z.array(z.enum(ISSUE_PRIORITY_VALUES)).default([]).catch([]),
	tag: z.array(z.string().min(1)).default([]).catch([]),
});

export type IssueFilters = {
	status: IssueStatus[];
	priority: IssuePriority[];
	tag: string[];
};

export const emptyIssueFilters: IssueFilters = {
	status: [],
	priority: [],
	tag: [],
};

export const issueSearchDefaults = {
	view: "list" as const,
	...emptyIssueFilters,
};

export function countIssueFilters(filters: IssueFilters) {
	return filters.status.length + filters.priority.length + filters.tag.length;
}

export function setFilterValue<T extends string>(
	values: T[],
	value: T,
	checked: boolean,
) {
	if (checked) {
		return values.includes(value) ? values : [...values, value];
	}
	return values.filter((item) => item !== value);
}
