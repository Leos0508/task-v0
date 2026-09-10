import { z } from "zod";
import type { IssuePriority, IssueStatus } from "#/db/schema";
import {
	defaultBoardCardFields,
	defaultIssueViewConfig,
	ISSUE_GRAPH_GROUP_BY,
	ISSUE_SORT_FIELDS,
	type IssueBoardCardField,
	type IssueGraphGroupBy,
	type IssueSortField,
	type IssueViewConfig,
	normalizeBoardCardFields,
} from "#/features/issues/schema";

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
	viewId: z.string().min(1).optional().catch(undefined),
	status: z.array(z.enum(ISSUE_STATUS_VALUES)).default([]).catch([]),
	priority: z.array(z.enum(ISSUE_PRIORITY_VALUES)).default([]).catch([]),
	tag: z.array(z.string().min(1)).default([]).catch([]),
	sort: z.enum(ISSUE_SORT_FIELDS).default("number").catch("number"),
	dir: z.enum(["asc", "desc"]).default("desc").catch("desc"),
	graph: z
		.union([z.boolean(), z.literal("true"), z.literal("false")])
		.transform((value) => value === true || value === "true")
		.default(false)
		.catch(false),
	groupBy: z.enum(ISSUE_GRAPH_GROUP_BY).default("status").catch("status"),
	card: z
		.array(z.enum(["priority", "status", "dates", "tags"]))
		.default([...defaultBoardCardFields])
		.catch([...defaultBoardCardFields])
		.transform(normalizeBoardCardFields),
});

export type IssueFilters = {
	status: IssueStatus[];
	priority: IssuePriority[];
	tag: string[];
};

export type IssueViewSearch = {
	view: IssueView;
	viewId?: string;
	status: IssueStatus[];
	priority: IssuePriority[];
	tag: string[];
	sort: IssueSortField;
	dir: "asc" | "desc";
	graph: boolean;
	groupBy: IssueGraphGroupBy;
	card: IssueBoardCardField[];
};

export const emptyIssueFilters: IssueFilters = {
	status: [],
	priority: [],
	tag: [],
};

export const issueSearchDefaults: IssueViewSearch = {
	view: "list",
	...emptyIssueFilters,
	sort: "number",
	dir: "desc",
	graph: false,
	groupBy: "status",
	card: [...defaultBoardCardFields],
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

export function viewConfigFromSearch(search: IssueViewSearch): IssueViewConfig {
	return {
		layout: search.view,
		filters: {
			status: search.status,
			priority: search.priority,
			tag: search.tag,
		},
		sort: {
			field: search.sort,
			direction: search.dir,
		},
		graph: {
			visible: search.graph,
			groupBy: search.groupBy,
		},
		board: {
			card: normalizeBoardCardFields(search.card),
		},
	};
}

export function searchFromViewConfig(
	viewId: string,
	config: IssueViewConfig,
): IssueViewSearch {
	return {
		viewId,
		view: config.layout,
		status: config.filters.status,
		priority: config.filters.priority,
		tag: config.filters.tag,
		sort: config.sort.field,
		dir: config.sort.direction,
		graph: config.graph.visible,
		groupBy: config.graph.groupBy,
		card: normalizeBoardCardFields(config.board.card),
	};
}

function sameStringList(left: string[], right: string[]) {
	if (left.length !== right.length) return false;
	const values = new Set(left);
	return right.every((item) => values.has(item));
}

export function isViewSearchDirty(
	search: IssueViewSearch,
	config: IssueViewConfig = defaultIssueViewConfig,
) {
	return (
		search.view !== config.layout ||
		search.sort !== config.sort.field ||
		search.dir !== config.sort.direction ||
		search.graph !== config.graph.visible ||
		search.groupBy !== config.graph.groupBy ||
		!sameStringList(search.status, config.filters.status) ||
		!sameStringList(search.priority, config.filters.priority) ||
		!sameStringList(search.tag, config.filters.tag) ||
		!sameStringList(
			normalizeBoardCardFields(search.card),
			normalizeBoardCardFields(config.board.card),
		)
	);
}
