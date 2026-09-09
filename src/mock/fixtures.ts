import type { ChangeHistoryItem } from "#/lib/data/change-history";
import type { DocumentListItem } from "#/lib/data/fetch-documents";
import type { IssueComment } from "#/lib/data/fetch-issue-comments";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import type { IssueTag } from "#/lib/data/fetch-tags";
import type { WorkspaceInviteItem } from "#/lib/data/fetch-workspace-invites";
import type { WorkspaceMember } from "#/lib/data/fetch-workspace-members";
import type { WorkspaceListItem } from "#/types/workspace";

export const MOCK_USER = {
	id: "user-nora",
	name: "Nora Chen",
	email: "nora@example.com",
	image: null as string | null,
};

export const MOCK_WORKSPACE_CODE = "v0";

export type MockTagTone = "product" | "editor" | "v0" | "writing";

export type MockTag = IssueTag & { tone: MockTagTone };

export const mockTags: MockTag[] = [
	{ id: "tag-product", name: "product", color: "teal", tone: "product" },
	{ id: "tag-editor", name: "editor", color: "violet", tone: "editor" },
	{ id: "tag-v0", name: "v0", color: "amber", tone: "v0" },
	{ id: "tag-writing", name: "writing", color: "sky", tone: "writing" },
];

const tagById = Object.fromEntries(mockTags.map((tag) => [tag.id, tag]));

function tags(...ids: string[]): MockTag[] {
	return ids
		.map((id) => tagById[id])
		.filter((tag): tag is MockTag => Boolean(tag));
}

export const mockWorkspaces: WorkspaceListItem[] = [
	{
		id: "ws-v0",
		code: "v0",
		name: "Task V0",
		color: "#1a1a1a",
		role: "OWNER",
		createdAt: "2026-08-01T12:00:00.000Z",
	},
	{
		id: "ws-acme",
		code: "ACME",
		name: "Acme Notes",
		color: "#7c9a7a",
		role: "ADMIN",
		createdAt: "2026-07-12T12:00:00.000Z",
	},
	{
		id: "ws-studio",
		code: "STUDIO",
		name: "Studio",
		color: "#8a7aa8",
		role: "MEMBER",
		createdAt: "2026-06-20T12:00:00.000Z",
	},
];

export const mockWorkspace = mockWorkspaces[0];

export type MockIssue = IssueListItem & {
	description: string;
	reporterName: string;
	linkedDocumentIds: string[];
};

export const mockIssues: MockIssue[] = [
	{
		id: "issue-1",
		number: 1,
		title: "Add features to documents including tags",
		status: "DONE",
		priority: "HIGH",
		startDate: "2026-09-01T09:00:00.000Z",
		endDate: "2026-09-05T17:00:00.000Z",
		rank: 1,
		createdAt: "2026-09-01T09:00:00.000Z",
		updatedAt: "2026-09-08T15:00:00.000Z",
		reporterName: MOCK_USER.name,
		tags: tags("tag-product", "tag-v0"),
		description:
			"Documents should group with pastel tags so related notes sit next to the issues they change.",
		linkedDocumentIds: ["welcome", "tagging"],
	},
	{
		id: "issue-2",
		number: 2,
		title: "Editor link feature",
		status: "DONE",
		priority: "MEDIUM",
		startDate: "2026-09-02T09:00:00.000Z",
		endDate: "2026-09-06T17:00:00.000Z",
		rank: 2,
		createdAt: "2026-09-02T09:00:00.000Z",
		updatedAt: "2026-09-08T16:00:00.000Z",
		reporterName: MOCK_USER.name,
		tags: tags("tag-editor", "tag-writing"),
		description:
			"Insert web and document links from the editor without leaving the page.",
		linkedDocumentIds: ["editor-links"],
	},
	{
		id: "issue-3",
		number: 3,
		title: "Compact mobile chrome",
		status: "IN_PROGRESS",
		priority: "HIGH",
		startDate: "2026-09-07T09:00:00.000Z",
		endDate: "2026-09-12T17:00:00.000Z",
		rank: 3,
		createdAt: "2026-09-07T09:00:00.000Z",
		updatedAt: "2026-09-08T18:00:00.000Z",
		reporterName: "Alex Rivera",
		tags: tags("tag-product"),
		description:
			"Hamburger + Task wordmark on small screens; sidebar stays a sheet overlay.",
		linkedDocumentIds: ["welcome"],
	},
	{
		id: "issue-4",
		number: 4,
		title: "Board empty-state copy",
		status: "TODO",
		priority: "LOW",
		startDate: null,
		endDate: null,
		rank: 4,
		createdAt: "2026-09-08T10:00:00.000Z",
		updatedAt: "2026-09-08T10:00:00.000Z",
		reporterName: MOCK_USER.name,
		tags: tags("tag-writing"),
		description: "Dashed placeholders when a status column has no issues.",
		linkedDocumentIds: [],
	},
	{
		id: "issue-5",
		number: 5,
		title: "Gantt date ranges for planning",
		status: "TODO",
		priority: "MEDIUM",
		startDate: "2026-09-10T09:00:00.000Z",
		endDate: "2026-09-18T17:00:00.000Z",
		rank: 5,
		createdAt: "2026-09-08T11:00:00.000Z",
		updatedAt: "2026-09-08T11:00:00.000Z",
		reporterName: "Alex Rivera",
		tags: tags("tag-v0"),
		description:
			"Show start and end as a simple bar row, not a full scheduler.",
		linkedDocumentIds: [],
	},
	{
		id: "issue-6",
		number: 6,
		title: "Spike: documents-first home",
		status: "CANCELLED",
		priority: null,
		startDate: null,
		endDate: null,
		rank: 6,
		createdAt: "2026-08-20T09:00:00.000Z",
		updatedAt: "2026-09-01T12:00:00.000Z",
		reporterName: MOCK_USER.name,
		tags: tags("tag-product"),
		description:
			"Rejected: keep the current overview as issue views, not a document grid.",
		linkedDocumentIds: [],
	},
];

export type MockDocument = DocumentListItem & {
	slug: string;
	body: { heading: string; paragraphs: string[]; bullets?: string[] }[];
	linkedIssueNumbers: number[];
};

export const mockDocuments: MockDocument[] = [
	{
		id: "welcome",
		slug: "welcome",
		title: "Welcome to Task V0",
		createdAt: "2026-09-01T08:00:00.000Z",
		updatedAt: "2026-09-08T14:00:00.000Z",
		tags: tags("tag-product", "tag-v0"),
		linkedIssueNumbers: [1, 3],
		body: [
			{
				heading: "What this workspace is",
				paragraphs: [
					"A personal space for issues and documents that sit beside each other. Tags are pastel pills; titles use a serif heading.",
					"This mock is clickable only. Nothing is saved.",
				],
			},
			{
				heading: "Start here",
				paragraphs: ["Open the issues board, then a detail page."],
				bullets: [
					"Keep TODO / IN_PROGRESS / DONE / CANCELLED",
					"Use the two-column detail layout",
					"Skip the design’s documents-first home",
				],
			},
		],
	},
	{
		id: "tagging",
		slug: "tagging",
		title: "Tagging documents",
		createdAt: "2026-09-02T08:00:00.000Z",
		updatedAt: "2026-09-08T14:30:00.000Z",
		tags: tags("tag-product", "tag-writing"),
		linkedIssueNumbers: [1],
		body: [
			{
				heading: "Tags",
				paragraphs: [
					"Map product tags to mint, lavender, pale yellow, and sky. Existing names stay; the mock restyles the pills.",
				],
			},
		],
	},
	{
		id: "editor-links",
		slug: "editor-links",
		title: "Editor links",
		createdAt: "2026-09-03T08:00:00.000Z",
		updatedAt: "2026-09-08T15:00:00.000Z",
		tags: tags("tag-editor", "tag-writing"),
		linkedIssueNumbers: [2],
		body: [
			{
				heading: "Links",
				paragraphs: [
					"The production editor can insert web and document links. This mock only shows typography and a fake toolbar.",
				],
			},
		],
	},
];

export const mockMembers: WorkspaceMember[] = [
	{
		id: "mem-1",
		userId: MOCK_USER.id,
		name: MOCK_USER.name,
		email: MOCK_USER.email,
		role: "OWNER",
		createdAt: "2026-08-01T12:00:00.000Z",
	},
	{
		id: "mem-2",
		userId: "user-alex",
		name: "Alex Rivera",
		email: "alex@example.com",
		role: "ADMIN",
		createdAt: "2026-08-10T12:00:00.000Z",
	},
	{
		id: "mem-3",
		userId: "user-sam",
		name: "Sam Patel",
		email: "sam@example.com",
		role: "MEMBER",
		createdAt: "2026-08-18T12:00:00.000Z",
	},
];

export const mockInvites: WorkspaceInviteItem[] = [
	{
		id: "inv-1",
		email: "guest@example.com",
		role: "MEMBER",
		token: "demo",
		expiresAt: "2026-10-01T00:00:00.000Z",
		createdAt: "2026-09-05T12:00:00.000Z",
	},
];

export const mockApiKeys = [
	{
		id: "key-1",
		name: "Cursor",
		start: "task_mock_a1b2",
		createdAt: "2026-09-01T12:00:00.000Z",
		expiresAt: null as string | null,
	},
	{
		id: "key-2",
		name: "Local MCP",
		start: "task_mock_c3d4",
		createdAt: "2026-09-04T12:00:00.000Z",
		expiresAt: "2026-12-01T00:00:00.000Z",
	},
];

export const mockCommentsByIssue: Record<number, IssueComment[]> = {
	1: [
		{
			id: "c-1",
			body: "Tags landed on documents first; issues reuse the same pills.",
			createdAt: "2026-09-05T14:00:00.000Z",
			updatedAt: "2026-09-05T14:00:00.000Z",
			author: { id: "user-alex", name: "Alex Rivera", image: null },
		},
	],
	3: [
		{
			id: "c-2",
			body: "Mobile header should stay compact without changing desktop IA.",
			createdAt: "2026-09-08T11:00:00.000Z",
			updatedAt: "2026-09-08T11:00:00.000Z",
			author: { id: MOCK_USER.id, name: MOCK_USER.name, image: null },
		},
	],
};

function history(
	id: string,
	field: ChangeHistoryItem["field"],
	oldValue: string | null,
	newValue: string | null,
	createdAt: string,
	actorName = MOCK_USER.name,
	actorId = MOCK_USER.id,
): ChangeHistoryItem {
	return {
		id,
		field,
		oldValue,
		newValue,
		createdAt,
		actor: { id: actorId, name: actorName },
	};
}

export const mockIssueHistory: Record<number, ChangeHistoryItem[]> = {
	1: [
		history("h1", "status", "IN_PROGRESS", "DONE", "2026-09-05T16:00:00.000Z"),
		history("h2", "tag", null, "product", "2026-09-02T10:00:00.000Z"),
		history(
			"h3",
			"document",
			null,
			"Tagging documents",
			"2026-09-02T11:00:00.000Z",
		),
	],
	2: [
		history("h4", "status", "TODO", "DONE", "2026-09-06T12:00:00.000Z"),
		history(
			"h5",
			"title",
			"Links",
			"Editor link feature",
			"2026-09-03T09:00:00.000Z",
		),
	],
	3: [
		history(
			"h6",
			"status",
			"TODO",
			"IN_PROGRESS",
			"2026-09-08T09:00:00.000Z",
			"Alex Rivera",
			"user-alex",
		),
	],
	6: [history("h7", "status", "TODO", "CANCELLED", "2026-09-01T12:00:00.000Z")],
};

export const mockDocumentHistory: Record<string, ChangeHistoryItem[]> = {
	welcome: [
		history(
			"dh1",
			"title",
			"Welcome",
			"Welcome to Task V0",
			"2026-09-01T09:00:00.000Z",
		),
		history("dh2", "tag", null, "v0", "2026-09-01T09:30:00.000Z"),
	],
	tagging: [
		history("dh3", "description", null, "updated", "2026-09-08T14:30:00.000Z"),
	],
	"editor-links": [
		history("dh4", "issue", null, "TASK-2", "2026-09-03T10:00:00.000Z"),
	],
};

export function getMockIssue(issueNumber: number) {
	return mockIssues.find((issue) => issue.number === issueNumber);
}

export function getMockDocument(id: string) {
	return mockDocuments.find(
		(document) => document.id === id || document.slug === id,
	);
}

export function documentsForIssue(issue: MockIssue) {
	return mockDocuments.filter((document) =>
		issue.linkedDocumentIds.includes(document.id),
	);
}

export function issuesForDocument(document: MockDocument) {
	return mockIssues.filter((issue) =>
		document.linkedIssueNumbers.includes(issue.number),
	);
}
