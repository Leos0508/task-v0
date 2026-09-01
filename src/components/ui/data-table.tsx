import type { ReactTable, RowData } from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import type { DataTableFeatures } from "#/lib/data-table";
import { cn } from "#/lib/utils";

type DataTableProps<TData extends RowData> = {
	table: ReactTable<DataTableFeatures, TData>;
	emptyMessage?: string;
	className?: string;
};

export function DataTable<TData extends RowData>({
	table,
	emptyMessage = "No results.",
	className,
}: DataTableProps<TData>) {
	const rows = table.getRowModel().rows;
	const columnCount = table.getAllColumns().length;

	return (
		<div className={cn("overflow-hidden rounded-lg border", className)}>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead
									key={header.id}
									className={header.column.columnDef.meta?.className}
								>
									{header.isPlaceholder ? null : (
										<table.FlexRender header={header} />
									)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{rows.length > 0 ? (
						rows.map((row) => (
							<TableRow key={row.id}>
								{row.getAllCells().map((cell) => (
									<TableCell
										key={cell.id}
										className={cell.column.columnDef.meta?.className}
									>
										<table.FlexRender cell={cell} />
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={columnCount}
								className="h-24 text-center text-muted-foreground"
							>
								{emptyMessage}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
