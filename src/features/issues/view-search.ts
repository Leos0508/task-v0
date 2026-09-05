import { z } from "zod";

export const ISSUE_VIEWS = ["list", "board", "gantt"] as const;

export type IssueView = (typeof ISSUE_VIEWS)[number];

export const issueViewSearchSchema = z.object({
	view: z.enum(ISSUE_VIEWS).default("list").catch("list"),
});
