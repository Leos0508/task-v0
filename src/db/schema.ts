import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		issuer: text("issuer").notNull(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("account_issuer_accountId_uidx").on(
			table.issuer,
			table.accountId,
		),
		index("account_userId_idx").on(table.userId),
	],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const apikey = pgTable(
	"apikey",
	{
		id: text("id").primaryKey(),
		configId: text("config_id").notNull().default("default"),
		name: text("name"),
		start: text("start"),
		prefix: text("prefix"),
		key: text("key").notNull(),
		referenceId: text("reference_id").notNull(),
		refillInterval: integer("refill_interval"),
		refillAmount: integer("refill_amount"),
		lastRefillAt: timestamp("last_refill_at"),
		enabled: boolean("enabled").default(true),
		rateLimitEnabled: boolean("rate_limit_enabled").default(true),
		rateLimitTimeWindow: integer("rate_limit_time_window"),
		rateLimitMax: integer("rate_limit_max"),
		requestCount: integer("request_count"),
		remaining: integer("remaining"),
		lastRequest: timestamp("last_request"),
		expiresAt: timestamp("expires_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		permissions: text("permissions"),
		metadata: text("metadata"),
	},
	(table) => [
		index("apikey_key_idx").on(table.key),
		index("apikey_referenceId_idx").on(table.referenceId),
		index("apikey_configId_idx").on(table.configId),
	],
);

export const workspaceRole = pgEnum("workspace_role", [
	"MEMBER",
	"ADMIN",
	"OWNER",
]);

export const issueStatus = pgEnum("issue_status", [
	"TODO",
	"IN_PROGRESS",
	"DONE",
	"CANCELLED",
]);

export const issuePriority = pgEnum("issue_priority", [
	"LOW",
	"MEDIUM",
	"HIGH",
	"URGENT",
]);

export type WorkspaceRole = (typeof workspaceRole.enumValues)[number];
export type IssueStatus = (typeof issueStatus.enumValues)[number];
export type IssuePriority = (typeof issuePriority.enumValues)[number];

export const workspace = pgTable("workspace", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	code: text("code").unique().notNull(),
	name: text("name").notNull(),
	color: text("color").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const workspaceUser = pgTable(
	"workspace_user",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		role: workspaceRole("role").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspace.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("workspace_user_userId_workspaceId_uidx").on(
			table.userId,
			table.workspaceId,
		),
		index("workspace_user_userId_idx").on(table.userId),
		index("workspace_user_workspaceId_idx").on(table.workspaceId),
	],
);

export const workspaceInvite = pgTable(
	"workspace_invite",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		email: text("email").notNull(),
		role: workspaceRole("role").notNull(),
		token: text("token").notNull().unique(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspace.id, { onDelete: "cascade" }),
		invitedById: text("invited_by_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("workspace_invite_workspaceId_email_uidx").on(
			table.workspaceId,
			table.email,
		),
		index("workspace_invite_workspaceId_idx").on(table.workspaceId),
		index("workspace_invite_email_idx").on(table.email),
	],
);

export const issue = pgTable(
	"issue",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		number: integer("number").notNull(),
		title: text("title").notNull(),
		description: jsonb("description"),
		status: issueStatus("status").notNull().default("TODO"),
		priority: issuePriority("priority"),
		startDate: date("start_date"),
		endDate: date("end_date"),
		rank: integer("rank").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspace.id, { onDelete: "cascade" }),
		reporterId: text("reporter_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
	},
	(table) => [
		uniqueIndex("issue_workspaceId_number_uidx").on(
			table.workspaceId,
			table.number,
		),
		index("issue_workspaceId_idx").on(table.workspaceId),
		index("issue_reporterId_idx").on(table.reporterId),
		index("issue_status_idx").on(table.status),
		index("issue_workspaceId_status_rank_idx").on(
			table.workspaceId,
			table.status,
			table.rank,
		),
	],
);

export const document = pgTable(
	"document",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		title: text("title").notNull(),
		description: jsonb("description"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspace.id, { onDelete: "cascade" }),
	},
	(table) => [index("document_workspaceId_idx").on(table.workspaceId)],
);

export const issueDocument = pgTable(
	"issue_document",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		documentId: text("document_id")
			.notNull()
			.references(() => document.id, { onDelete: "cascade" }),
		issueId: text("issue_id")
			.notNull()
			.references(() => issue.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("issue_document_issueId_documentId_uidx").on(
			table.issueId,
			table.documentId,
		),
		index("issue_document_documentId_idx").on(table.documentId),
	],
);

export const tag = pgTable(
	"tag",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		name: text("name").notNull(),
		color: text("color").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspace.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("tag_workspaceId_name_uidx").on(table.workspaceId, table.name),
		index("tag_workspaceId_idx").on(table.workspaceId),
	],
);

export const issueTag = pgTable(
	"issue_tag",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		tagId: text("tag_id")
			.notNull()
			.references(() => tag.id, { onDelete: "cascade" }),
		issueId: text("issue_id")
			.notNull()
			.references(() => issue.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("issue_tag_issueId_tagId_uidx").on(table.issueId, table.tagId),
		index("issue_tag_tagId_idx").on(table.tagId),
	],
);

export const documentTag = pgTable(
	"document_tag",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		tagId: text("tag_id")
			.notNull()
			.references(() => tag.id, { onDelete: "cascade" }),
		documentId: text("document_id")
			.notNull()
			.references(() => document.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("document_tag_documentId_tagId_uidx").on(
			table.documentId,
			table.tagId,
		),
		index("document_tag_tagId_idx").on(table.tagId),
	],
);

export const issueComment = pgTable(
	"issue_comment",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		body: text("body").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		issueId: text("issue_id")
			.notNull()
			.references(() => issue.id, { onDelete: "cascade" }),
		authorId: text("author_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
	},
	(table) => [
		index("issue_comment_issueId_idx").on(table.issueId),
		index("issue_comment_authorId_idx").on(table.authorId),
	],
);

export const workspaceFile = pgTable(
	"workspace_file",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		key: text("key").notNull(),
		mimeType: text("mime_type").notNull(),
		size: integer("size").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspace.id, { onDelete: "cascade" }),
		uploadedById: text("uploaded_by_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
	},
	(table) => [
		index("workspace_file_workspaceId_idx").on(table.workspaceId),
		index("workspace_file_uploadedById_idx").on(table.uploadedById),
	],
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	apiKeys: many(apikey),
	workspaceUsers: many(workspaceUser),
	invitesSent: many(workspaceInvite),
	issuesReported: many(issue),
	issueComments: many(issueComment),
	uploadedFiles: many(workspaceFile),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
	user: one(user, {
		fields: [apikey.referenceId],
		references: [user.id],
	}),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const workspaceRelations = relations(workspace, ({ many }) => ({
	issues: many(issue),
	workspaceUsers: many(workspaceUser),
	invites: many(workspaceInvite),
	documents: many(document),
	tags: many(tag),
	files: many(workspaceFile),
}));

export const workspaceUserRelations = relations(workspaceUser, ({ one }) => ({
	user: one(user, {
		fields: [workspaceUser.userId],
		references: [user.id],
	}),
	workspace: one(workspace, {
		fields: [workspaceUser.workspaceId],
		references: [workspace.id],
	}),
}));

export const workspaceInviteRelations = relations(
	workspaceInvite,
	({ one }) => ({
		workspace: one(workspace, {
			fields: [workspaceInvite.workspaceId],
			references: [workspace.id],
		}),
		invitedBy: one(user, {
			fields: [workspaceInvite.invitedById],
			references: [user.id],
		}),
	}),
);

export const issueRelations = relations(issue, ({ one, many }) => ({
	workspace: one(workspace, {
		fields: [issue.workspaceId],
		references: [workspace.id],
	}),
	reporter: one(user, {
		fields: [issue.reporterId],
		references: [user.id],
	}),
	issueDocuments: many(issueDocument),
	issueTags: many(issueTag),
	issueComments: many(issueComment),
}));

export const documentRelations = relations(document, ({ one, many }) => ({
	workspace: one(workspace, {
		fields: [document.workspaceId],
		references: [workspace.id],
	}),
	issueDocuments: many(issueDocument),
	documentTags: many(documentTag),
}));

export const issueDocumentRelations = relations(issueDocument, ({ one }) => ({
	issue: one(issue, {
		fields: [issueDocument.issueId],
		references: [issue.id],
	}),
	document: one(document, {
		fields: [issueDocument.documentId],
		references: [document.id],
	}),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
	workspace: one(workspace, {
		fields: [tag.workspaceId],
		references: [workspace.id],
	}),
	issueTags: many(issueTag),
	documentTags: many(documentTag),
}));

export const issueTagRelations = relations(issueTag, ({ one }) => ({
	issue: one(issue, {
		fields: [issueTag.issueId],
		references: [issue.id],
	}),
	tag: one(tag, {
		fields: [issueTag.tagId],
		references: [tag.id],
	}),
}));

export const documentTagRelations = relations(documentTag, ({ one }) => ({
	document: one(document, {
		fields: [documentTag.documentId],
		references: [document.id],
	}),
	tag: one(tag, {
		fields: [documentTag.tagId],
		references: [tag.id],
	}),
}));

export const issueCommentRelations = relations(issueComment, ({ one }) => ({
	issue: one(issue, {
		fields: [issueComment.issueId],
		references: [issue.id],
	}),
	author: one(user, {
		fields: [issueComment.authorId],
		references: [user.id],
	}),
}));

export const workspaceFileRelations = relations(workspaceFile, ({ one }) => ({
	workspace: one(workspace, {
		fields: [workspaceFile.workspaceId],
		references: [workspace.id],
	}),
	uploadedBy: one(user, {
		fields: [workspaceFile.uploadedById],
		references: [user.id],
	}),
}));
