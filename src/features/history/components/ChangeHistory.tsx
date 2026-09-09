import { useState } from "react";
import { Button } from "#/components/ui/button";
import { formatHistoryChange } from "#/features/history/format-history";
import type { ChangeHistoryItem } from "#/lib/data/change-history";
import { formatDateTime, formatRelativeTime } from "#/lib/utils";

export const VISIBLE_HISTORY_ROWS = 5;

type ChangeHistoryProps = {
	entries: ChangeHistoryItem[];
};

export default function ChangeHistory({ entries }: ChangeHistoryProps) {
	const [expanded, setExpanded] = useState(false);
	const visible = entries.slice(0, VISIBLE_HISTORY_ROWS);
	const hidden = entries.slice(VISIBLE_HISTORY_ROWS);

	if (entries.length === 0) return null;

	return (
		<section
			aria-label="History"
			className="mb-8 flex flex-col gap-1.5"
		>
			<ul className="flex flex-col gap-1.5">
				{visible.map((entry) => (
					<HistoryRow key={entry.id} entry={entry} />
				))}
			</ul>
			{hidden.length > 0 ? (
				<>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-auto self-start px-0 text-xs text-muted-foreground"
						onClick={() => setExpanded((open) => !open)}
					>
						{expanded
							? "Hide earlier history"
							: `Show earlier history (${hidden.length})`}
					</Button>
					{expanded ? (
						<ul className="flex flex-col gap-1.5">
							{hidden.map((entry) => (
								<HistoryRow key={entry.id} entry={entry} />
							))}
						</ul>
					) : null}
				</>
			) : null}
		</section>
	);
}

function HistoryRow({ entry }: { entry: ChangeHistoryItem }) {
	return (
		<li className="text-xs text-muted-foreground">
			<span className="font-medium">{entry.actor.name}</span>{" "}
			{formatHistoryChange(entry)}
			{" - "}
			<time
				dateTime={entry.createdAt}
				title={formatDateTime(entry.createdAt)}
			>
				{formatRelativeTime(entry.createdAt)}
			</time>
		</li>
	);
}
