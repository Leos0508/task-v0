import type { User } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue, issueHistory, user as userTable } from "#/db/schema";
import { AppError } from "#/types/result";
import {
	type ChangeHistoryItem,
	HISTORY_FIELDS,
	type HistoryField,
} from "./change-history";
import { getWorkspaceAccess } from "./require-workspace-access";

function isHistoryField(value: string): value is HistoryField {
	return (HISTORY_FIELDS as readonly string[]).includes(value);
}

export async function fetchIssueHistory(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
): Promise<ChangeHistoryItem[]> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [existing] = await db
		.select({ id: issue.id })
		.from(issue)
		.where(
			and(eq(issue.workspaceId, workspace.id), eq(issue.number, issueNumber)),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Issue not found");
	}

	const rows = await db
		.select({
			id: issueHistory.id,
			field: issueHistory.field,
			oldValue: issueHistory.oldValue,
			newValue: issueHistory.newValue,
			createdAt: issueHistory.createdAt,
			actorId: userTable.id,
			actorName: userTable.name,
		})
		.from(issueHistory)
		.innerJoin(userTable, eq(issueHistory.actorId, userTable.id))
		.where(eq(issueHistory.issueId, existing.id))
		.orderBy(desc(issueHistory.createdAt), desc(issueHistory.id));

	return rows.flatMap((row) => {
		if (!isHistoryField(row.field)) return [];
		return [
			{
				id: row.id,
				field: row.field,
				oldValue: row.oldValue,
				newValue: row.newValue,
				createdAt: row.createdAt.toISOString(),
				actor: {
					id: row.actorId,
					name: row.actorName,
				},
			},
		];
	});
}
