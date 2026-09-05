import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
	draggable,
	dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/utils/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/utils/set-custom-native-drag-preview";
import {
	attachClosestEdge,
	type Edge,
	extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IssueStatus } from "#/db/schema";
import {
	PriorityBadge,
	STATUS_LABELS,
	STATUSES,
} from "#/features/issues/components/IssueBadges";
import { reorderIssueOnBoard } from "#/features/issues/reorder-issue";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import { compareIssueRank } from "#/lib/issue-rank";
import { cn } from "#/lib/utils";

const ISSUE_CARD = "issue-card";

function isIssueCardData(
	data: Record<string, unknown>,
): data is { type: typeof ISSUE_CARD; issue: IssueListItem } {
	return (
		data.type === ISSUE_CARD &&
		typeof data.issue === "object" &&
		data.issue !== null &&
		"id" in data.issue &&
		"status" in data.issue &&
		"number" in data.issue
	);
}

function DropGap({ edge }: { edge: Edge }) {
	return (
		<div
			aria-hidden
			className={cn(
				"pointer-events-none absolute right-1 left-1 z-10 h-0.5 rounded-full bg-primary",
				edge === "top" && "-top-1",
				edge === "bottom" && "-bottom-1",
			)}
		/>
	);
}

export default function IssueBoardView({
	workspaceCode,
	issues,
}: {
	workspaceCode: string;
	issues: IssueListItem[];
}) {
	const grouped = useMemo(() => {
		const columns = Object.fromEntries(
			STATUSES.map((status) => [status, [] as IssueListItem[]]),
		) as Record<IssueStatus, IssueListItem[]>;

		for (const issue of issues) {
			columns[issue.status].push(issue);
		}

		for (const status of STATUSES) {
			columns[status].sort(compareIssueRank);
		}

		return columns;
	}, [issues]);

	return (
		<div className="grid min-h-112 auto-rows-fr gap-3 md:grid-cols-4">
			{STATUSES.map((status) => (
				<BoardColumn
					key={status}
					status={status}
					issues={grouped[status]}
					workspaceCode={workspaceCode}
				/>
			))}
		</div>
	);
}

function BoardColumn({
	status,
	issues,
	workspaceCode,
}: {
	status: IssueStatus;
	issues: IssueListItem[];
	workspaceCode: string;
}) {
	const queryClient = useQueryClient();
	const columnRef = useRef<HTMLDivElement>(null);
	const [isOver, setIsOver] = useState(false);

	useEffect(() => {
		const element = columnRef.current;
		if (!element) return;

		return dropTargetForElements({
			element,
			getData: () => ({ type: "column", status }),
			canDrop: ({ source }) => source.data.type === ISSUE_CARD,
			onDragEnter: () => setIsOver(true),
			onDragLeave: () => setIsOver(false),
			onDrop: ({ source, location }) => {
				setIsOver(false);
				if (!isIssueCardData(source.data)) return;

				const cardTarget = location.current.dropTargets.find(
					(target) => target.data.type === "card",
				);
				const targetIssueId =
					typeof cardTarget?.data.issueId === "string"
						? cardTarget.data.issueId
						: undefined;
				const closestEdge = cardTarget
					? extractClosestEdge(cardTarget.data)
					: null;
				const edge =
					closestEdge === "top" || closestEdge === "bottom"
						? closestEdge
						: undefined;

				void reorderIssueOnBoard(
					queryClient,
					workspaceCode,
					source.data.issue,
					targetIssueId && edge ? { status, targetIssueId, edge } : { status },
				);
			},
		});
	}, [queryClient, status, workspaceCode]);

	return (
		<section
			ref={columnRef}
			className={cn(
				"flex min-h-64 flex-col gap-2 rounded-lg border bg-muted/30 p-2 transition-shadow",
				isOver && "ring-2 ring-primary/70",
			)}
		>
			<header className="flex items-center justify-between px-1 py-1">
				<h2 className="text-sm font-medium">{STATUS_LABELS[status]}</h2>
				<span className="text-xs text-muted-foreground">{issues.length}</span>
			</header>
			<div className="flex flex-1 flex-col">
				{issues.length === 0 && isOver ? (
					<div aria-hidden className="h-0.5 rounded-full bg-primary" />
				) : null}
				{issues.map((issue) => (
					<BoardCard
						key={issue.id}
						issue={issue}
						workspaceCode={workspaceCode}
					/>
				))}
			</div>
		</section>
	);
}

function BoardCard({
	issue,
	workspaceCode,
}: {
	issue: IssueListItem;
	workspaceCode: string;
}) {
	const cardRef = useRef<HTMLDivElement>(null);
	const dropRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

	useEffect(() => {
		const element = cardRef.current;
		const dropElement = dropRef.current;
		if (!element || !dropElement) return;

		return combine(
			draggable({
				element,
				getInitialData: () => ({ type: ISSUE_CARD, issue }),
				onGenerateDragPreview({ nativeSetDragImage }) {
					setCustomNativeDragPreview({
						nativeSetDragImage,
						getOffset: pointerOutsideOfPreview({ x: "12px", y: "8px" }),
						render({ container }) {
							const preview = element.cloneNode(true) as HTMLElement;
							preview.style.opacity = "0.2";
							preview.style.width = `${element.offsetWidth}px`;
							preview.style.pointerEvents = "none";
							container.appendChild(preview);
						},
					});
				},
				onDragStart() {
					setIsDragging(true);
				},
				onDrop() {
					setIsDragging(false);
				},
			}),
			dropTargetForElements({
				element: dropElement,
				canDrop({ source }) {
					return source.element !== element && source.data.type === ISSUE_CARD;
				},
				getIsSticky: () => true,
				getData({ input }) {
					return attachClosestEdge(
						{ type: "card", issueId: issue.id },
						{
							element: dropElement,
							input,
							allowedEdges: ["top", "bottom"],
						},
					);
				},
				onDragEnter({ self }) {
					setClosestEdge(extractClosestEdge(self.data));
				},
				onDrag({ self }) {
					const next = extractClosestEdge(self.data);
					setClosestEdge((current) => (current === next ? current : next));
				},
				onDragLeave() {
					setClosestEdge(null);
				},
				onDrop() {
					setClosestEdge(null);
				},
			}),
		);
	}, [issue]);

	return (
		<div ref={dropRef} className="relative pb-2 last:pb-0">
			<div
				ref={cardRef}
				className={cn(
					"relative cursor-grab rounded-md border bg-card p-2 shadow-xs transition-opacity active:cursor-grabbing",
					isDragging && "opacity-20",
				)}
			>
				{closestEdge ? <DropGap edge={closestEdge} /> : null}
				<p className="font-mono text-[11px] text-muted-foreground">
					#{issue.number}
				</p>
				<Link
					to="/app/$code/issues/$issueNumber"
					params={{
						code: workspaceCode,
						issueNumber: String(issue.number),
					}}
					className="mt-0.5 block text-sm font-medium leading-snug hover:underline"
				>
					{issue.title}
				</Link>
				<div className="mt-1.5 text-xs text-muted-foreground">
					<PriorityBadge priority={issue.priority} />
				</div>
			</div>
		</div>
	);
}
