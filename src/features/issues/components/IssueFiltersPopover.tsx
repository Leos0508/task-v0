import { ListFilterIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import type { IssuePriority, IssueStatus } from "#/db/schema";
import {
	PRIORITY_LABELS,
	PriorityBadge,
	STATUS_LABELS,
	STATUSES,
	StatusBadge,
} from "#/features/issues/components/IssueBadges";
import IssueTagBadge from "#/features/issues/components/IssueTagBadge";
import {
	countIssueFilters,
	emptyIssueFilters,
	type IssueFilters,
	setFilterValue,
} from "#/features/issues/view-search";
import type { IssueTag } from "#/lib/data/fetch-tags";

const FILTER_PRIORITIES: IssuePriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export default function IssueFiltersPopover({
	tags,
	filters,
	onFiltersChange,
}: {
	tags: IssueTag[];
	filters: IssueFilters;
	onFiltersChange: (filters: IssueFilters) => void;
}) {
	const activeCount = countIssueFilters(filters);
	const tagsById = new Map(tags.map((tag) => [tag.id, tag]));

	function setStatus(status: IssueStatus, checked: boolean) {
		onFiltersChange({
			...filters,
			status: setFilterValue(filters.status, status, checked),
		});
	}

	function setPriority(priority: IssuePriority, checked: boolean) {
		onFiltersChange({
			...filters,
			priority: setFilterValue(filters.priority, priority, checked),
		});
	}

	function setTag(tagId: string, checked: boolean) {
		onFiltersChange({
			...filters,
			tag: setFilterValue(filters.tag, tagId, checked),
		});
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Popover>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						aria-label={
							activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"
						}
					>
						<ListFilterIcon />
						Filters
						{activeCount > 0 ? (
							<Badge variant="secondary">{activeCount}</Badge>
						) : null}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="flex max-h-[var(--radix-popover-content-available-height)] w-80 flex-col overflow-hidden p-0"
				>
					<PopoverHeader className="flex-row items-center justify-between gap-3 px-4 py-3">
						<div className="min-w-0">
							<PopoverTitle>Filters</PopoverTitle>
							<PopoverDescription>
								Empty groups match everything
							</PopoverDescription>
						</div>
						{activeCount > 0 ? (
							<Button
								type="button"
								variant="ghost"
								size="xs"
								onClick={() => onFiltersChange(emptyIssueFilters)}
							>
								Clear all
							</Button>
						) : null}
					</PopoverHeader>
					<Separator />
					<div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
						<FilterSection title="Status">
							{STATUSES.map((status) => {
								const id = `issue-filter-status-${status}`;
								return (
									<FilterSwitchRow
										key={status}
										id={id}
										checked={filters.status.includes(status)}
										onCheckedChange={(checked) => setStatus(status, checked)}
									>
										<StatusBadge status={status} />
									</FilterSwitchRow>
								);
							})}
						</FilterSection>
						<FilterSection title="Priority">
							{FILTER_PRIORITIES.map((priority) => {
								const id = `issue-filter-priority-${priority}`;
								return (
									<FilterSwitchRow
										key={priority}
										id={id}
										checked={filters.priority.includes(priority)}
										onCheckedChange={(checked) =>
											setPriority(priority, checked)
										}
									>
										<PriorityBadge priority={priority} />
									</FilterSwitchRow>
								);
							})}
						</FilterSection>
						<FilterSection title="Tags">
							{tags.length === 0 ? (
								<p className="px-1 text-xs text-muted-foreground">
									No tags in this workspace
								</p>
							) : (
								tags.map((tag) => {
									const id = `issue-filter-tag-${tag.id}`;
									return (
										<FilterSwitchRow
											key={tag.id}
											id={id}
											checked={filters.tag.includes(tag.id)}
											onCheckedChange={(checked) => setTag(tag.id, checked)}
										>
											<IssueTagBadge tag={tag} />
										</FilterSwitchRow>
									);
								})
							)}
						</FilterSection>
					</div>
				</PopoverContent>
			</Popover>
			{STATUSES.filter((status) => filters.status.includes(status)).map(
				(status) => (
					<FilterChip
						key={status}
						label={STATUS_LABELS[status]}
						onRemove={() => setStatus(status, false)}
					/>
				),
			)}
			{FILTER_PRIORITIES.filter((priority) =>
				filters.priority.includes(priority),
			).map((priority) => (
				<FilterChip
					key={priority}
					label={PRIORITY_LABELS[priority]}
					onRemove={() => setPriority(priority, false)}
				/>
			))}
			{filters.tag.map((tagId) => {
				const tag = tagsById.get(tagId);
				if (!tag) return null;
				return (
					<IssueTagBadge
						key={tag.id}
						tag={tag}
						onRemove={() => setTag(tag.id, false)}
					/>
				);
			})}
			{activeCount > 0 ? (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => onFiltersChange(emptyIssueFilters)}
				>
					Clear
				</Button>
			) : null}
		</div>
	);
}

function FilterSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-1.5">
			<h3 className="px-1 text-xs font-medium text-muted-foreground">
				{title}
			</h3>
			<div className="space-y-0.5">{children}</div>
		</section>
	);
}

function FilterSwitchRow({
	id,
	checked,
	onCheckedChange,
	children,
}: {
	id: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	children: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5">
			<Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer font-normal">
				{children}
			</Label>
			<Switch
				id={id}
				size="sm"
				checked={checked}
				onCheckedChange={onCheckedChange}
			/>
		</div>
	);
}

function FilterChip({
	label,
	onRemove,
}: {
	label: string;
	onRemove: () => void;
}) {
	return (
		<Badge variant="secondary" className="pr-0.5">
			{label}
			<button
				type="button"
				className="rounded-full p-0.5 hover:bg-foreground/10"
				onClick={onRemove}
			>
				<XIcon className="size-3" />
				<span className="sr-only">Remove {label} filter</span>
			</button>
		</Badge>
	);
}
