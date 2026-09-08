CREATE TABLE "workspace_file" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workspace_id" text NOT NULL,
	"uploaded_by_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_file" ADD CONSTRAINT "workspace_file_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_file" ADD CONSTRAINT "workspace_file_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_file_workspaceId_idx" ON "workspace_file" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_file_uploadedById_idx" ON "workspace_file" USING btree ("uploaded_by_id");