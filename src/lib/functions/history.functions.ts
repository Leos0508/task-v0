import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchDocumentHistory } from "#/lib/data/fetch-document-history";
import { fetchIssueHistory } from "#/lib/data/fetch-issue-history";
import { authMiddleware } from "#/middlewares/auth-middleware";

export const listIssueHistoryFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			issueNumber: z.number().int().positive(),
		}),
	)
	.handler(async ({ data, context }) =>
		fetchIssueHistory(context.user, data.workspaceCode, data.issueNumber),
	);

export const listDocumentHistoryFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			workspaceCode: z.string(),
			documentId: z.string().min(1),
		}),
	)
	.handler(async ({ data, context }) =>
		fetchDocumentHistory(context.user, data.workspaceCode, data.documentId),
	);
