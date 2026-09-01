import {
	columnFilteringFeature,
	createFilteredRowModel,
	createSortedRowModel,
	createTableHook,
	filterFn_equalsString,
	filterFn_includesString,
	globalFilteringFeature,
	metaHelper,
	rowSortingFeature,
	sortFn_text,
	tableFeatures,
} from "@tanstack/react-table";

type DataTableColumnMeta = {
	className?: string;
};

const dataTableFeatures = tableFeatures({
	columnFilteringFeature,
	globalFilteringFeature,
	rowSortingFeature,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	filterFns: {
		equalsString: filterFn_equalsString,
		includesString: filterFn_includesString,
	},
	sortFns: {
		text: sortFn_text,
	},
	columnMeta: metaHelper<DataTableColumnMeta>(),
});

export const { useAppTable, createAppColumnHelper } = createTableHook({
	features: dataTableFeatures,
	defaultColumn: {
		enableSorting: false,
		enableColumnFilter: false,
	},
	globalFilterFn: "includesString",
});

export type DataTableFeatures = typeof dataTableFeatures;
