import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
	draggable,
	dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { GripVerticalIcon } from "lucide-react";
import {
	Fragment,
	type KeyboardEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "#/components/ui/button";
import type { IssueStatus } from "#/db/schema";
import {
	ISSUE_CARD,
	isIssueCardData,
	placeholderBeforeId,
	reorderInputAtIndex,
	reorderInputFromPointer,
} from "#/features/issues/board-drop";
import {
	PriorityBadge,
	STATUS_COLUMN_TINT,
	STATUS_DOT,
	STATUS_LABELS,
	STATUSES,
} from "#/features/issues/components/IssueBadges";
import IssueListTags from "#/features/issues/components/IssueListTags";
import { issueKeys } from "#/features/issues/queries";
import { reorderIssueOnBoard } from "#/features/issues/reorder-issue";
import type {
	IssueBoardCardField,
	ReorderIssueInput,
} from "#/features/issues/schema";
import type { IssueListItem } from "#/lib/data/fetch-issues";
import { compareIssueRank } from "#/lib/issue-rank";
import { cn, formatDateTime } from "#/lib/utils";

type DropPreview = {
	status: IssueStatus;
	beforeIssueId: string | null;
};

export default function IssueBoardView({
	workspaceCode,
	issues,
	cardFields,
}: {
	workspaceCode: string;
	issues: IssueListItem[];
	cardFields: IssueBoardCardField[];
}) {
	const queryClient = useQueryClient();
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [dragHeight, setDragHeight] = useState(72);
	const [preview, setPreview] = useState<DropPreview | null>(null);
	const [focusIssueId, setFocusIssueId] = useState<string | null>(null);
	const [liveMessage, setLiveMessage] = useState("");

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

	function moveIssue(issue: IssueListItem, input: ReorderIssueInput) {
		setLiveMessage(`Moved #${issue.number} to ${STATUS_LABELS[input.status]}`);
		setFocusIssueId(issue.id);
		void reorderIssueOnBoard(queryClient, workspaceCode, issue, input);
	}

	const scrollerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = scrollerRef.current;
		if (!element) return;
		return autoScrollForElements({
			element,
			canScroll: ({ source }) => source.data.type === ISSUE_CARD,
		});
	}, []);

	return (
		<div ref={scrollerRef} className="h-full overflow-auto md:overflow-hidden">
			<p className="sr-only">
				Board cards can be dragged between columns. Focus a card, then use arrow
				keys to reorder or change status. Enter opens the issue.
			</p>
			<div className="sr-only" aria-live="polite">
				{liveMessage}
			</div>
			<div className="grid min-h-112 gap-3 md:h-full md:grid-cols-4">
				{STATUSES.map((status) => (
					<BoardColumn
						key={status}
						status={status}
						issues={grouped[status]}
						workspaceCode={workspaceCode}
						draggingId={draggingId}
						dragHeight={dragHeight}
						preview={preview?.status === status ? preview : null}
						focusIssueId={focusIssueId}
						onDraggingIdChange={setDraggingId}
						onDragHeightChange={setDragHeight}
						onPreviewChange={setPreview}
						onMove={moveIssue}
						cardFields={cardFields}
					/>
				))}
			</div>
		</div>
	);
}

function BoardColumn({
	status,
	issues,
	workspaceCode,
	draggingId,
	dragHeight,
	preview,
	focusIssueId,
	onDraggingIdChange,
	onDragHeightChange,
	onPreviewChange,
	onMove,
	cardFields,
}: {
	status: IssueStatus;
	issues: IssueListItem[];
	workspaceCode: string;
	draggingId: string | null;
	dragHeight: number;
	preview: DropPreview | null;
	focusIssueId: string | null;
	onDraggingIdChange: (id: string | null) => void;
	onDragHeightChange: (height: number) => void;
	onPreviewChange: (preview: DropPreview | null) => void;
	onMove: (issue: IssueListItem, input: ReorderIssueInput) => void;
	cardFields: IssueBoardCardField[];
}) {
	const columnRef = useRef<HTMLElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		const element = columnRef.current;
		const listElement = listRef.current;
		if (!element || !listElement) return;

		return combine(
			dropTargetForElements({
				element,
				getIsSticky: () => true,
				getData: () => ({ type: "column", status }),
				canDrop: ({ source }) => source.data.type === ISSUE_CARD,
				onDrag({ source, location }) {
					if (!isIssueCardData(source.data)) return;
					onPreviewChange({
						status,
						beforeIssueId: placeholderBeforeId(
							listElement,
							location.current.input.clientY,
							source.data.issue.id,
						),
					});
				},
				onDragLeave: () => {
					onPreviewChange(null);
				},
				onDrop: ({ source, location }) => {
					if (!isIssueCardData(source.data)) {
						onPreviewChange(null);
						onDraggingIdChange(null);
						return;
					}
					onMove(
						source.data.issue,
						reorderInputFromPointer(
							status,
							listElement,
							location.current.input.clientY,
							source.data.issue.id,
						),
					);
					onPreviewChange(null);
					onDraggingIdChange(null);
				},
			}),
			autoScrollForElements({
				element: listElement,
				canScroll: ({ source }) => source.data.type === ISSUE_CARD,
				getAllowedAxis: () => "vertical",
			}),
		);
	}, [onDraggingIdChange, onMove, onPreviewChange, status]);

	const placeholderBefore = preview?.beforeIssueId ?? null;
	const showEndPlaceholder = preview != null && placeholderBefore == null;
	const visibleCount = issues.filter((issue) => issue.id !== draggingId).length;

	return (
		<section
			ref={columnRef}
			className={cn(
				"flex min-h-64 min-w-0 flex-col gap-2 rounded-lg border p-2 md:h-full md:min-h-0",
				STATUS_COLUMN_TINT[status],
			)}
		>
			<header className="flex items-center justify-between px-1 py-1">
				<h2 className="flex items-center gap-2 text-sm font-medium">
					<span
						aria-hidden
						className={cn("size-2.5 rounded-full", STATUS_DOT[status])}
					/>
					{STATUS_LABELS[status]}
				</h2>
				<span className="text-xs text-muted-foreground">{issues.length}</span>
			</header>
			<ul
				ref={listRef}
				aria-label={STATUS_LABELS[status]}
				className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto"
			>
				{issues.map((issue) => (
					<Fragment key={issue.id}>
						{placeholderBefore === issue.id ? (
							<li aria-hidden>
								<DropPlaceholder height={dragHeight} />
							</li>
						) : null}
						<li className={cn(issue.id === draggingId && "hidden")}>
							<BoardCard
								issue={issue}
								workspaceCode={workspaceCode}
								focusIssueId={focusIssueId}
								cardFields={cardFields}
								onDraggingIdChange={onDraggingIdChange}
								onDragHeightChange={onDragHeightChange}
								onMove={onMove}
							/>
						</li>
					</Fragment>
				))}
				{showEndPlaceholder ? (
					<li aria-hidden>
						<DropPlaceholder height={dragHeight} />
					</li>
				) : null}
				{visibleCount === 0 && !preview ? (
					<li className="flex flex-1 items-center justify-center rounded-md border border-dashed px-2 py-6 text-center text-xs text-muted-foreground">
						Drop here
					</li>
				) : null}
			</ul>
		</section>
	);
}

function DropPlaceholder({ height }: { height: number }) {
	return (
		<div
			aria-hidden
			className="rounded-md border-2 border-dashed border-primary/50 bg-primary/10"
			style={{ minHeight: height }}
		/>
	);
}

function BoardCard({
	issue,
	workspaceCode,
	focusIssueId,
	cardFields,
	onDraggingIdChange,
	onDragHeightChange,
	onMove,
}: {
	issue: IssueListItem;
	workspaceCode: string;
	focusIssueId: string | null;
	cardFields: IssueBoardCardField[];
	onDraggingIdChange: (id: string | null) => void;
	onDragHeightChange: (height: number) => void;
	onMove: (issue: IssueListItem, input: ReorderIssueInput) => void;
}) {
	const queryClient = useQueryClient();
	const cardRef = useRef<HTMLDivElement>(null);
	const moveRef = useRef<HTMLButtonElement>(null);
	const suppressClickRef = useRef(false);
	const issueRef = useRef(issue);
	issueRef.current = issue;

	useEffect(() => {
		if (focusIssueId === issue.id) {
			moveRef.current?.focus();
		}
	}, [focusIssueId, issue.id]);

	useEffect(() => {
		const element = cardRef.current;
		if (!element) return;

		return draggable({
			element,
			getInitialData: () => ({ type: ISSUE_CARD, issue: issueRef.current }),
			onGenerateDragPreview({ nativeSetDragImage, location, source }) {
				setCustomNativeDragPreview({
					nativeSetDragImage,
					getOffset: preserveOffsetOnSource({
						element: source.element,
						input: location.current.input,
					}),
					render({ container }) {
						const preview = element.cloneNode(true) as HTMLElement;
						preview.style.width = `${element.offsetWidth}px`;
						preview.style.pointerEvents = "none";
						preview.style.opacity = "1";
						preview.style.boxShadow = "0 12px 24px -8px rgb(0 0 0 / 0.25)";
						preview.style.transform = "rotate(1.5deg)";
						container.appendChild(preview);
					},
				});
			},
			onDragStart() {
				suppressClickRef.current = true;
				onDragHeightChange(element.getBoundingClientRect().height);
				onDraggingIdChange(issueRef.current.id);
			},
			onDrop() {
				onDraggingIdChange(null);
			},
		});
	}, [onDragHeightChange, onDraggingIdChange]);

	function handleMoveKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		const rows =
			queryClient.getQueryData<IssueListItem[]>(issueKeys.all(workspaceCode)) ??
			[];
		const status = issueRef.current.status;
		const column = rows
			.filter((row) => row.status === status)
			.sort(compareIssueRank);
		const index = column.findIndex((row) => row.id === issueRef.current.id);
		if (index === -1) return;
		const current = column[index];

		if (event.key === "ArrowUp" && index > 0) {
			event.preventDefault();
			onMove(
				current,
				reorderInputAtIndex(
					status,
					column.filter((row) => row.id !== current.id),
					index - 1,
				),
			);
			return;
		}

		if (event.key === "ArrowDown" && index < column.length - 1) {
			event.preventDefault();
			onMove(
				current,
				reorderInputAtIndex(
					status,
					column.filter((row) => row.id !== current.id),
					index + 1,
				),
			);
			return;
		}

		const statusIndex = STATUSES.indexOf(status);
		if (event.key === "ArrowLeft" && statusIndex > 0) {
			event.preventDefault();
			const nextStatus = STATUSES[statusIndex - 1];
			const others = rows
				.filter((row) => row.status === nextStatus)
				.sort(compareIssueRank);
			onMove(
				current,
				reorderInputAtIndex(nextStatus, others, Math.min(index, others.length)),
			);
			return;
		}

		if (event.key === "ArrowRight" && statusIndex < STATUSES.length - 1) {
			event.preventDefault();
			const nextStatus = STATUSES[statusIndex + 1];
			const others = rows
				.filter((row) => row.status === nextStatus)
				.sort(compareIssueRank);
			onMove(
				current,
				reorderInputAtIndex(nextStatus, others, Math.min(index, others.length)),
			);
		}
	}

	const dateLabel =
		cardFields.includes("dates") && (issue.startDate || issue.endDate)
			? [issue.startDate, issue.endDate]
					.filter(Boolean)
					.map((value) => formatDateTime(value as string))
					.join(" – ")
			: null;
	const showTags = cardFields.includes("tags") && issue.tags.length > 0;
	const showPriority = cardFields.includes("priority");
	const showCardMeta = showPriority || dateLabel != null || showTags;

	return (
		<div
			ref={cardRef}
			data-board-card
			data-issue-id={issue.id}
			className="relative flex min-w-0 cursor-grab flex-col gap-0.5 overflow-hidden rounded-md border bg-card p-2 shadow-xs active:cursor-grabbing"
			onPointerDown={() => {
				suppressClickRef.current = false;
			}}
		>
			<div className="flex items-start justify-between gap-1">
				<p className="font-mono text-[11px] text-muted-foreground">
					#{issue.number}
				</p>
				<Button
					ref={moveRef}
					type="button"
					variant="ghost"
					size="icon-xs"
					className="shrink-0 text-muted-foreground"
					aria-label={`Move #${issue.number}`}
					title="Arrow keys reorder or change status"
					onKeyDown={handleMoveKeyDown}
				>
					<GripVerticalIcon />
				</Button>
			</div>
			<Link
				to="/app/$code/issues/$issueNumber"
				params={{
					code: workspaceCode,
					issueNumber: String(issue.number),
				}}
				draggable={false}
				className="block text-sm font-medium leading-snug hover:underline"
				onClick={(event) => {
					if (!suppressClickRef.current) return;
					event.preventDefault();
					event.stopPropagation();
				}}
			>
				{issue.title}
			</Link>
			{showCardMeta ? (
				<div className="mt-1 flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
					{showPriority ? (
						<PriorityBadge priority={issue.priority} size="sm" />
					) : null}
					{dateLabel ? <p className="truncate">{dateLabel}</p> : null}
					{showTags ? (
						<div className="min-w-0 max-w-full">
							<IssueListTags tags={issue.tags} empty={null} />
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}
