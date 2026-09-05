ALTER TABLE "issue" ADD COLUMN "rank" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "issue" AS target
SET "rank" = ranked.rn * 1024
FROM (
	SELECT
		"id",
		ROW_NUMBER() OVER (
			PARTITION BY "workspace_id", "status"
			ORDER BY "number" DESC
		) AS rn
	FROM "issue"
) AS ranked
WHERE target."id" = ranked."id";--> statement-breakpoint
CREATE INDEX "issue_workspaceId_status_rank_idx" ON "issue" USING btree ("workspace_id","status","rank");