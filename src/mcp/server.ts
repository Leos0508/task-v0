import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import type { User } from "better-auth";
import { z } from "zod";
import { updateDocumentSchema } from "#/features/documents/schema";
import {
	createCommentSchema,
	createTagSchema,
	issueEndDateTimeSchema,
	issueStartDateTimeSchema,
	tagColorSchema,
	updateIssueSchema,
	updateTagSchema,
} from "#/features/issues/schema";
import { createComment } from "#/lib/data/create-comment";
import { createDocument } from "#/lib/data/create-document";
import { createIssue } from "#/lib/data/create-issue";
import { createTag } from "#/lib/data/create-tag";
import { fetchDocument } from "#/lib/data/fetch-document";
import { fetchDocumentHistory } from "#/lib/data/fetch-document-history";
import { fetchDocuments } from "#/lib/data/fetch-documents";
import { fetchIssue } from "#/lib/data/fetch-issue";
import { fetchIssueComments } from "#/lib/data/fetch-issue-comments";
import { fetchIssueHistory } from "#/lib/data/fetch-issue-history";
import { fetchIssues } from "#/lib/data/fetch-issues";
import { fetchTags } from "#/lib/data/fetch-tags";
import { fetchWorkspaces } from "#/lib/data/fetch-workspaces";
import { linkTagToDocument } from "#/lib/data/link-tag-to-document";
import { linkTagToIssue } from "#/lib/data/link-tag-to-issue";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { resolveDescriptionImages } from "#/lib/data/resolve-description-images";
import { unlinkTagFromDocument } from "#/lib/data/unlink-tag-from-document";
import { unlinkTagFromIssue } from "#/lib/data/unlink-tag-from-issue";
import { updateDocument } from "#/lib/data/update-document";
import { updateIssue } from "#/lib/data/update-issue";
import { updateTag } from "#/lib/data/update-tag";
import { formatMcpError } from "#/mcp/errors";
import { markdownToTipTap, tipTapToMarkdown } from "#/mcp/markdown";

const issueStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);
const issuePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

function jsonResult(data: unknown) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
	};
}

function errorResult(error: unknown) {
	return {
		content: [{ type: "text" as const, text: formatMcpError(error) }],
		isError: true as const,
	};
}

const descriptionImageHint =
	" Include workspace images with ![alt](/files/{fileId}) or ![alt]({fileId}).";

async function markdownDescription(
	user: User,
	workspaceCode: string,
	markdown: string,
) {
	return resolveDescriptionImages(
		user,
		workspaceCode,
		markdownToTipTap(markdown),
	);
}

function createTaskMcpServer(user: User) {
	const server = new McpServer({
		name: "task-v0",
		version: "1.0.0",
	});

	server.registerTool(
		"list_workspaces",
		{
			description: "List workspaces the authenticated user belongs to.",
			inputSchema: z.object({}),
		},
		async () => {
			try {
				return jsonResult(await fetchWorkspaces(user));
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"get_workspace",
		{
			description:
				"Get a workspace the user belongs to by code. Does not include members.",
			inputSchema: z.object({
				code: z.string().min(1),
			}),
		},
		async ({ code }) => {
			try {
				const access = await getWorkspaceAccess(user, code);
				return jsonResult({
					id: access.workspace.id,
					code: access.workspace.code,
					name: access.workspace.name,
					color: access.workspace.color,
					role: access.role,
				});
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"list_issues",
		{
			description: "List issues in a workspace, optionally filtered.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				status: issueStatusSchema.optional(),
				priority: issuePrioritySchema.nullable().optional(),
			}),
		},
		async ({ workspaceCode, status, priority }) => {
			try {
				let issues = await fetchIssues(user, workspaceCode);
				if (status !== undefined) {
					issues = issues.filter((item) => item.status === status);
				}
				if (priority !== undefined) {
					issues = issues.filter((item) => item.priority === priority);
				}
				return jsonResult(issues);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"get_issue",
		{
			description:
				"Get one issue by workspace code and issue number. Description is markdown.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				issueNumber: z.number().int().positive(),
			}),
		},
		async ({ workspaceCode, issueNumber }) => {
			try {
				const issue = await fetchIssue(user, workspaceCode, issueNumber);
				return jsonResult({
					...issue,
					description: tipTapToMarkdown(issue.description),
				});
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"create_issue",
		{
			description:
				"Create an issue with a title and optional markdown description. Start and end accept ISO datetimes or YYYY-MM-DDTHH:mm (UTC); date-only YYYY-MM-DD is start or end of that UTC day." +
				descriptionImageHint,
			inputSchema: z
				.object({
					workspaceCode: z.string().min(1),
					title: z.string().min(1).max(200),
					status: issueStatusSchema.optional(),
					priority: issuePrioritySchema.nullable().optional(),
					startDate: issueStartDateTimeSchema.optional(),
					endDate: issueEndDateTimeSchema.optional(),
					description: z.string().optional(),
				})
				.refine(
					(value) =>
						!value.startDate ||
						!value.endDate ||
						value.startDate <= value.endDate,
					{ message: "End must be on or after start", path: ["endDate"] },
				),
		},
		async ({
			workspaceCode,
			title,
			status,
			priority,
			startDate,
			endDate,
			description,
		}) => {
			try {
				const created = await createIssue(user, workspaceCode, {
					title,
					status,
					priority,
					startDate,
					endDate,
					description:
						description === undefined
							? undefined
							: await markdownDescription(user, workspaceCode, description),
				});
				const issue = await fetchIssue(user, workspaceCode, created.number);
				return jsonResult({
					...issue,
					description: tipTapToMarkdown(issue.description),
				});
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"update_issue",
		{
			description:
				"Update an issue. Pass only fields to change. Description is markdown. Start and end accept ISO datetimes or YYYY-MM-DDTHH:mm (UTC); date-only YYYY-MM-DD is start or end of that UTC day." +
				descriptionImageHint,
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				issueNumber: z.number().int().positive(),
				title: z.string().min(1).max(200).optional(),
				status: issueStatusSchema.optional(),
				priority: issuePrioritySchema.nullable().optional(),
				startDate: issueStartDateTimeSchema.optional(),
				endDate: issueEndDateTimeSchema.optional(),
				description: z.string().optional(),
			}),
		},
		async ({
			workspaceCode,
			issueNumber,
			title,
			status,
			priority,
			startDate,
			endDate,
			description,
		}) => {
			try {
				const input = updateIssueSchema.parse({
					title,
					status,
					priority,
					startDate,
					endDate,
					description:
						description === undefined
							? undefined
							: await markdownDescription(user, workspaceCode, description),
				});
				await updateIssue(user, workspaceCode, issueNumber, input);
				const issue = await fetchIssue(user, workspaceCode, issueNumber);
				return jsonResult({
					...issue,
					description: tipTapToMarkdown(issue.description),
				});
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"list_tags",
		{
			description: "List tags in a workspace.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
			}),
		},
		async ({ workspaceCode }) => {
			try {
				return jsonResult(await fetchTags(user, workspaceCode));
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"create_tag",
		{
			description:
				"Create a workspace tag with a name and optional palette color.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				name: createTagSchema.shape.name,
				color: tagColorSchema.optional(),
			}),
		},
		async ({ workspaceCode, name, color }) => {
			try {
				return jsonResult(
					await createTag(user, workspaceCode, { name, color }),
				);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"update_tag",
		{
			description: "Rename or recolor a workspace tag. Requires ADMIN.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				tagId: z.string().min(1),
				name: createTagSchema.shape.name.optional(),
				color: tagColorSchema.optional(),
			}),
		},
		async ({ workspaceCode, tagId, name, color }) => {
			try {
				const input = updateTagSchema.parse({ name, color });
				return jsonResult(await updateTag(user, workspaceCode, tagId, input));
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"link_tag",
		{
			description: "Attach a workspace tag to an issue.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				issueNumber: z.number().int().positive(),
				tagId: z.string().min(1),
			}),
		},
		async ({ workspaceCode, issueNumber, tagId }) => {
			try {
				return jsonResult(
					await linkTagToIssue(user, workspaceCode, issueNumber, tagId),
				);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"unlink_tag",
		{
			description: "Remove a workspace tag from an issue.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				issueNumber: z.number().int().positive(),
				tagId: z.string().min(1),
			}),
		},
		async ({ workspaceCode, issueNumber, tagId }) => {
			try {
				return jsonResult(
					await unlinkTagFromIssue(user, workspaceCode, issueNumber, tagId),
				);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"link_document_tag",
		{
			description: "Attach a workspace tag to a document.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				documentId: z.string().min(1),
				tagId: z.string().min(1),
			}),
		},
		async ({ workspaceCode, documentId, tagId }) => {
			try {
				return jsonResult(
					await linkTagToDocument(user, workspaceCode, documentId, tagId),
				);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"unlink_document_tag",
		{
			description: "Remove a workspace tag from a document.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				documentId: z.string().min(1),
				tagId: z.string().min(1),
			}),
		},
		async ({ workspaceCode, documentId, tagId }) => {
			try {
				return jsonResult(
					await unlinkTagFromDocument(user, workspaceCode, documentId, tagId),
				);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"list_comments",
		{
			description: "List comments on an issue, oldest first.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				issueNumber: z.number().int().positive(),
			}),
		},
		async ({ workspaceCode, issueNumber }) => {
			try {
				return jsonResult(
					await fetchIssueComments(user, workspaceCode, issueNumber),
				);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"list_issue_history",
		{
			description:
				"List field-change history for an issue, newest first. Description changes are recorded without body diffs.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				issueNumber: z.number().int().positive(),
			}),
		},
		async ({ workspaceCode, issueNumber }) => {
			try {
				return jsonResult(
					await fetchIssueHistory(user, workspaceCode, issueNumber),
				);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"create_comment",
		{
			description: "Add a plain-text comment to an issue.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				issueNumber: z.number().int().positive(),
				body: createCommentSchema.shape.body,
			}),
		},
		async ({ workspaceCode, issueNumber, body }) => {
			try {
				return jsonResult(
					await createComment(user, workspaceCode, issueNumber, { body }),
				);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"list_documents",
		{
			description: "List documents in a workspace, including tags.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
			}),
		},
		async ({ workspaceCode }) => {
			try {
				return jsonResult(await fetchDocuments(user, workspaceCode));
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"get_document",
		{
			description:
				"Get one document by workspace code and document id. Description is markdown. Includes tags.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				documentId: z.string().min(1),
			}),
		},
		async ({ workspaceCode, documentId }) => {
			try {
				const document = await fetchDocument(user, workspaceCode, documentId);
				return jsonResult({
					...document,
					description: tipTapToMarkdown(document.description),
				});
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"create_document",
		{
			description:
				"Create a document with a title and optional markdown description." +
				descriptionImageHint,
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				title: z.string().min(1).max(200),
				description: z.string().optional(),
			}),
		},
		async ({ workspaceCode, title, description }) => {
			try {
				const created = await createDocument(user, workspaceCode, {
					title,
					description:
						description === undefined
							? undefined
							: await markdownDescription(user, workspaceCode, description),
				});
				const document = await fetchDocument(user, workspaceCode, created.id);
				return jsonResult({
					...document,
					description: tipTapToMarkdown(document.description),
				});
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"update_document",
		{
			description:
				"Update a document. Pass only fields to change. Description is markdown." +
				descriptionImageHint,
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				documentId: z.string().min(1),
				title: z.string().min(1).max(200).optional(),
				description: z.string().optional(),
			}),
		},
		async ({ workspaceCode, documentId, title, description }) => {
			try {
				const input = updateDocumentSchema.parse({
					title,
					description:
						description === undefined
							? undefined
							: await markdownDescription(user, workspaceCode, description),
				});
				await updateDocument(user, workspaceCode, documentId, input);
				const document = await fetchDocument(user, workspaceCode, documentId);
				return jsonResult({
					...document,
					description: tipTapToMarkdown(document.description),
				});
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	server.registerTool(
		"list_document_history",
		{
			description:
				"List field-change history for a document, newest first. Content changes are recorded without body diffs.",
			inputSchema: z.object({
				workspaceCode: z.string().min(1),
				documentId: z.string().min(1),
			}),
		},
		async ({ workspaceCode, documentId }) => {
			try {
				return jsonResult(
					await fetchDocumentHistory(user, workspaceCode, documentId),
				);
			} catch (error) {
				return errorResult(error);
			}
		},
	);

	return server;
}

export function createTaskMcpHandler(user: User) {
	return createMcpHandler(() => createTaskMcpServer(user));
}
