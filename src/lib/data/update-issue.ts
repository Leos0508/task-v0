import type { User } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { issue } from "#/db/schema";
import type { UpdateIssueInput } from "#/features/issues/schema";
import {
	type HistoryChange,
	insertIssueHistory,
	instantValue,
	sameInstant,
	sameJson,
	tipTapText,
} from "#/lib/data/change-history";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { RANK_GAP } from "#/lib/issue-rank";
import { AppError } from "#/types/result";

export async function updateIssue(
	sessionUser: User,
	workspaceCode: string,
	issueNumber: number,
	input: UpdateIssueInput,
) {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	const [existing] = await db
		.select({
			id: issue.id,
			number: issue.number,
			title: issue.title,
			description: issue.description,
			status: issue.status,
			priority: issue.priority,
			startDate: issue.startDate,
			endDate: issue.endDate,
		})
		.from(issue)
		.where(
			and(eq(issue.workspaceId, workspace.id), eq(issue.number, issueNumber)),
		)
		.limit(1);

	if (!existing) {
		throw new AppError("NOT_FOUND", "Issue not found");
	}

	const patch: {
		title?: string;
		status?: UpdateIssueInput["status"];
		priority?: UpdateIssueInput["priority"];
		startDate?: Date | null;
		endDate?: Date | null;
		description?: unknown;
		rank?: number;
	} = {};
	const changes: HistoryChange[] = [];

	if (input.title !== undefined) {
		const title = input.title.trim();
		if (title !== existing.title) {
			patch.title = title;
			changes.push({
				field: "title",
				oldValue: existing.title,
				newValue: title,
			});
		}
	}
	if (input.status !== undefined && input.status !== existing.status) {
		const [last] = await db
			.select({ rank: issue.rank })
			.from(issue)
			.where(
				and(
					eq(issue.workspaceId, workspace.id),
					eq(issue.status, input.status),
				),
			)
			.orderBy(desc(issue.rank))
			.limit(1);
		patch.status = input.status;
		patch.rank = (last?.rank ?? 0) + RANK_GAP;
		changes.push({
			field: "status",
			oldValue: existing.status,
			newValue: input.status,
		});
	}
	if (input.priority !== undefined && input.priority !== existing.priority) {
		patch.priority = input.priority;
		changes.push({
			field: "priority",
			oldValue: existing.priority,
			newValue: input.priority,
		});
	}
	if (input.startDate !== undefined) {
		const startDate = input.startDate ? new Date(input.startDate) : null;
		if (!sameInstant(existing.startDate, startDate)) {
			patch.startDate = startDate;
			changes.push({
				field: "startDate",
				oldValue: instantValue(existing.startDate),
				newValue: instantValue(startDate),
			});
		}
	}
	if (input.endDate !== undefined) {
		const endDate = input.endDate ? new Date(input.endDate) : null;
		if (!sameInstant(existing.endDate, endDate)) {
			patch.endDate = endDate;
			changes.push({
				field: "endDate",
				oldValue: instantValue(existing.endDate),
				newValue: instantValue(endDate),
			});
		}
	}
	if (
		input.description !== undefined &&
		!sameJson(existing.description, input.description)
	) {
		patch.description = JSON.parse(JSON.stringify(input.description));
		if (tipTapText(existing.description) !== tipTapText(input.description)) {
			changes.push({
				field: "description",
				oldValue: null,
				newValue: null,
			});
		}
	}

	if (Object.keys(patch).length > 0) {
		await db.update(issue).set(patch).where(eq(issue.id, existing.id));
	}
	await insertIssueHistory(existing.id, sessionUser.id, changes);

	return { number: existing.number };
}
