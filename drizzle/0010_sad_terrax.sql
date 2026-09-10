CREATE TABLE "issue_view" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issue_view" ADD CONSTRAINT "issue_view_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_view" ADD CONSTRAINT "issue_view_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "issue_view_workspaceId_name_uidx" ON "issue_view" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "issue_view_workspaceId_idx" ON "issue_view" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "issue_view_createdById_idx" ON "issue_view" USING btree ("created_by_id");