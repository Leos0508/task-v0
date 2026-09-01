CREATE TYPE "public"."issue_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('MEMBER', 'ADMIN', 'OWNER');--> statement-breakpoint
CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" jsonb,
	"status" "issue_status" DEFAULT 'TODO' NOT NULL,
	"priority" "issue_priority",
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"reporter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_document" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"issue_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "workspace_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "workspace_role" NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"invited_by_id" text NOT NULL,
	CONSTRAINT "workspace_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "workspace_user" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "workspace_role" NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_document" ADD CONSTRAINT "issue_document_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_document" ADD CONSTRAINT "issue_document_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_user" ADD CONSTRAINT "workspace_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_user" ADD CONSTRAINT "workspace_user_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_workspaceId_idx" ON "document" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_workspaceId_number_uidx" ON "issue" USING btree ("workspace_id","number");--> statement-breakpoint
CREATE INDEX "issue_workspaceId_idx" ON "issue" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "issue_reporterId_idx" ON "issue" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "issue_status_idx" ON "issue" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_document_issueId_documentId_uidx" ON "issue_document" USING btree ("issue_id","document_id");--> statement-breakpoint
CREATE INDEX "issue_document_documentId_idx" ON "issue_document" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invite_workspaceId_email_uidx" ON "workspace_invite" USING btree ("workspace_id","email");--> statement-breakpoint
CREATE INDEX "workspace_invite_workspaceId_idx" ON "workspace_invite" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invite_email_idx" ON "workspace_invite" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_user_userId_workspaceId_uidx" ON "workspace_user" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_user_userId_idx" ON "workspace_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_user_workspaceId_idx" ON "workspace_user" USING btree ("workspace_id");