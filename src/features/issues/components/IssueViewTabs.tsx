import { Columns3Icon, GanttChartIcon, ListIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { ISSUE_VIEWS, type IssueView } from "#/features/issues/view-search";

export default function IssueViewTabs({
	view,
	onViewChange,
}: {
	view: IssueView;
	onViewChange: (view: IssueView) => void;
}) {
	return (
		<Tabs
			value={view}
			onValueChange={(next) => {
				if (!ISSUE_VIEWS.includes(next as IssueView)) return;
				onViewChange(next as IssueView);
			}}
		>
			<TabsList>
				<TabsTrigger value="list">
					<ListIcon />
					List
				</TabsTrigger>
				<TabsTrigger value="board">
					<Columns3Icon />
					Board
				</TabsTrigger>
				<TabsTrigger value="gantt">
					<GanttChartIcon />
					Gantt
				</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
