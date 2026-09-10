import { SlidersHorizontalIcon } from "lucide-react";
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
import {
	defaultBoardCardFields,
	ISSUE_BOARD_CARD_FIELDS,
	type IssueBoardCardField,
	normalizeBoardCardFields,
} from "#/features/issues/schema";
import { setFilterValue } from "#/features/issues/view-search";

const CARD_FIELD_LABELS: Record<IssueBoardCardField, string> = {
	priority: "Priority",
	dates: "Start / end",
	tags: "Tags",
};

export default function IssueBoardCardPopover({
	card,
	onChange,
}: {
	card: IssueBoardCardField[];
	onChange: (card: IssueBoardCardField[]) => void;
}) {
	const fields = normalizeBoardCardFields(card);
	const isCustom = !sameCardFields(fields, defaultBoardCardFields);

	function setField(field: IssueBoardCardField, checked: boolean) {
		onChange(normalizeBoardCardFields(setFilterValue(fields, field, checked)));
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					aria-label={isCustom ? "Card fields, customized" : "Card fields"}
				>
					<SlidersHorizontalIcon />
					Cards
					{isCustom ? <Badge variant="secondary">On</Badge> : null}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="flex w-72 flex-col overflow-hidden p-0"
			>
				<PopoverHeader className="flex-row items-center justify-between gap-3 px-4 py-3">
					<div className="min-w-0">
						<PopoverTitle>Card fields</PopoverTitle>
						<PopoverDescription>Board cards only</PopoverDescription>
					</div>
					{isCustom ? (
						<Button
							type="button"
							variant="ghost"
							size="xs"
							onClick={() => onChange([...defaultBoardCardFields])}
						>
							Reset
						</Button>
					) : null}
				</PopoverHeader>
				<Separator />
				<div className="space-y-1 p-3">
					{ISSUE_BOARD_CARD_FIELDS.map((field) => {
						const id = `board-card-field-${field}`;
						return (
							<div
								key={field}
								className="flex items-center justify-between gap-3 px-1 py-1"
							>
								<Label htmlFor={id} className="font-normal">
									{CARD_FIELD_LABELS[field]}
								</Label>
								<Switch
									id={id}
									size="sm"
									checked={fields.includes(field)}
									onCheckedChange={(checked) => setField(field, checked)}
								/>
							</div>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}

function sameCardFields(
	left: readonly IssueBoardCardField[],
	right: readonly IssueBoardCardField[],
) {
	return (
		left.length === right.length &&
		left.every((field, index) => field === right[index])
	);
}
