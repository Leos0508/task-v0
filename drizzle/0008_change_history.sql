CREATE TABLE "document_history" (
	"id" text PRIMARY KEY NOT NULL,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"document_id" text NOT NULL,
	"actor_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_history" (
	"id" text PRIMARY KEY NOT NULL,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"issue_id" text NOT NULL,
	"actor_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_history" ADD CONSTRAINT "document_history_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_history_documentId_idx" ON "document_history" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_history_actorId_idx" ON "document_history" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "issue_history_issueId_idx" ON "issue_history" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issue_history_actorId_idx" ON "issue_history" USING btree ("actor_id");