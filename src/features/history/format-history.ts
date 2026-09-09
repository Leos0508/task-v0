import type { IssuePriority, IssueStatus } from "#/db/schema";
import {
	PRIORITY_LABELS,
	STATUS_LABELS,
} from "#/features/issues/components/IssueBadges";
import type { ChangeHistoryItem } from "#/lib/data/change-history";
import { formatDateTime } from "#/lib/utils";

function quoted(value: string) {
	return `"${value}"`;
}

function statusLabel(value: string) {
	return STATUS_LABELS[value as IssueStatus] ?? value;
}

function priorityLabel(value: string) {
	return PRIORITY_LABELS[value as IssuePriority] ?? value;
}

function dateLabel(value: string) {
	return formatDateTime(value);
}

function changed(
	label: string,
	oldValue: string | null,
	newValue: string | null,
	format: (value: string) => string = quoted,
) {
	if (newValue && !oldValue) return `set the ${label} to ${format(newValue)}`;
	if (!newValue && oldValue) return `cleared the ${label}`;
	if (oldValue && newValue) {
		return `changed the ${label} from ${format(oldValue)} to ${format(newValue)}`;
	}
	return `updated the ${label}`;
}

function linked(
	kind: string,
	oldValue: string | null,
	newValue: string | null,
) {
	if (newValue && !oldValue) return `linked ${kind} ${quoted(newValue)}`;
	if (!newValue && oldValue) return `unlinked ${kind} ${quoted(oldValue)}`;
	return `updated a ${kind} link`;
}

export function formatHistoryChange(entry: ChangeHistoryItem) {
	switch (entry.field) {
		case "title":
			return changed("title", entry.oldValue, entry.newValue);
		case "description":
			return "updated the description";
		case "status":
			return changed("status", entry.oldValue, entry.newValue, statusLabel);
		case "priority":
			return changed("priority", entry.oldValue, entry.newValue, priorityLabel);
		case "startDate":
			return changed("start", entry.oldValue, entry.newValue, dateLabel);
		case "endDate":
			return changed("end", entry.oldValue, entry.newValue, dateLabel);
		case "tag":
			if (entry.newValue && !entry.oldValue) {
				return `added tag ${quoted(entry.newValue)}`;
			}
			if (!entry.newValue && entry.oldValue) {
				return `removed tag ${quoted(entry.oldValue)}`;
			}
			return "updated tags";
		case "document":
			return linked("document", entry.oldValue, entry.newValue);
		case "issue":
			return linked("issue", entry.oldValue, entry.newValue);
	}
}
