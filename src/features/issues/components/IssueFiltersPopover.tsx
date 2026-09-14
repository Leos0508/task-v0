import { ListFilterIcon } from "lucide-react";
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
	PriorityBadge,
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
						<Badge
							variant="destructive"
							className="size-5 rounded-full p-0 text-[12px] leading-none tabular-nums"
						>
							{activeCount}
						</Badge>
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
