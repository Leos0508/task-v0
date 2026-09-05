CREATE TABLE "issue_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"issue_id" text NOT NULL,
	"author_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"tag_id" text NOT NULL,
	"issue_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issue_comment" ADD CONSTRAINT "issue_comment_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_comment" ADD CONSTRAINT "issue_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_tag" ADD CONSTRAINT "issue_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_tag" ADD CONSTRAINT "issue_tag_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issue_comment_issueId_idx" ON "issue_comment" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issue_comment_authorId_idx" ON "issue_comment" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_tag_issueId_tagId_uidx" ON "issue_tag" USING btree ("issue_id","tag_id");--> statement-breakpoint
CREATE INDEX "issue_tag_tagId_idx" ON "issue_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_workspaceId_name_uidx" ON "tag" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "tag_workspaceId_idx" ON "tag" USING btree ("workspace_id");