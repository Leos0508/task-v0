import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { MouseEventHandler, ReactNode } from "react";
import { Button } from "#/components/ui/button";
import type { SortDirection } from "#/lib/list-sort";
import { cn } from "#/lib/utils";

export default function ListSortHeader({
	label,
	direction,
	onClick,
	accessibleName,
	className,
}: {
	label: ReactNode;
	direction: false | SortDirection;
	onClick: MouseEventHandler<HTMLButtonElement>;
	accessibleName?: string;
	className?: string;
}) {
	const name = accessibleName ?? (typeof label === "string" ? label : "column");
	const sortState =
		direction === "asc"
			? "ascending"
			: direction === "desc"
				? "descending"
				: "not sorted";

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			aria-label={`Sort by ${name}, ${sortState}`}
			className={cn("-ml-2 h-8 px-2 has-[>svg]:px-1.5", className)}
			onClick={onClick}
		>
			{label}
			{direction === "asc" ? <ChevronUpIcon /> : null}
			{direction === "desc" ? <ChevronDownIcon /> : null}
		</Button>
	);
}
