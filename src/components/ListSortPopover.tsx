import { ArrowUpDownIcon, CheckIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Separator } from "#/components/ui/separator";
import { type SortDirection, selectListSortField } from "#/lib/list-sort";
import { cn } from "#/lib/utils";

export type ListSortFieldOption<F extends string> = {
	value: F;
	label: string;
};

const DEFAULT_DIR_LABELS = {
	asc: "Ascending",
	desc: "Descending",
} as const;

export default function ListSortPopover<F extends string>({
	fields,
	sort,
	dir,
	defaultSort,
	defaultDir,
	onChange,
	dirLabels = DEFAULT_DIR_LABELS,
}: {
	fields: readonly ListSortFieldOption<F>[];
	sort: F;
	dir: SortDirection;
	defaultSort: F;
	defaultDir: SortDirection;
	onChange: (next: { sort: F; dir: SortDirection }) => void;
	dirLabels?: { asc: string; desc: string };
}) {
	const isCustom = sort !== defaultSort || dir !== defaultDir;
	const fieldLabel =
		fields.find((field) => field.value === sort)?.label ?? sort;
	const summary = `${fieldLabel} · ${dirLabels[dir]}`;

	function reset() {
		onChange({ sort: defaultSort, dir: defaultDir });
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Popover>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						aria-label={isCustom ? `Sort, ${summary}` : "Sort"}
					>
						<ArrowUpDownIcon />
						Sort
						{isCustom ? <Badge variant="secondary">1</Badge> : null}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="flex max-h-[var(--radix-popover-content-available-height)] w-72 flex-col overflow-hidden p-0"
				>
					<PopoverHeader className="flex-row items-center justify-between gap-3 px-4 py-3">
						<div className="min-w-0">
							<PopoverTitle>Sort</PopoverTitle>
							<PopoverDescription>One field and direction</PopoverDescription>
						</div>
						{isCustom ? (
							<Button type="button" variant="ghost" size="xs" onClick={reset}>
								Reset
							</Button>
						) : null}
					</PopoverHeader>
					<Separator />
					<div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
						{fields.length > 1 ? (
							<SortSection title="Field">
								{fields.map((field) => (
									<SortChoice
										key={field.value}
										selected={sort === field.value}
										onSelect={() =>
											onChange(selectListSortField({ sort, dir }, field.value))
										}
									>
										{field.label}
									</SortChoice>
								))}
							</SortSection>
						) : null}
						<SortSection title="Direction">
							<SortChoice
								selected={dir === "asc"}
								onSelect={() => onChange({ sort, dir: "asc" })}
							>
								{dirLabels.asc}
							</SortChoice>
							<SortChoice
								selected={dir === "desc"}
								onSelect={() => onChange({ sort, dir: "desc" })}
							>
								{dirLabels.desc}
							</SortChoice>
						</SortSection>
					</div>
				</PopoverContent>
			</Popover>
			{isCustom ? (
				<>
					<Badge variant="secondary" className="pr-0.5">
						{summary}
						<button
							type="button"
							className="rounded-full p-0.5 hover:bg-foreground/10"
							onClick={reset}
						>
							<XIcon className="size-3" />
							<span className="sr-only">Reset sort</span>
						</button>
					</Badge>
					<Button type="button" variant="ghost" size="sm" onClick={reset}>
						Reset
					</Button>
				</>
			) : null}
		</div>
	);
}

function SortSection({
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

function SortChoice({
	selected,
	onSelect,
	children,
}: {
	selected: boolean;
	onSelect: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex w-full items-center justify-between gap-3 rounded-md px-1 py-1.5 text-left text-sm outline-none hover:bg-accent",
				selected && "bg-accent",
			)}
			aria-pressed={selected}
			onClick={onSelect}
		>
			<span className="min-w-0 flex-1">{children}</span>
			{selected ? <CheckIcon className="size-4 shrink-0" /> : null}
		</button>
	);
}
