import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "@tanstack/react-router";
import {
	ChevronDownIcon,
	CircleIcon,
	FileTextIcon,
	LayoutGridIcon,
	ListChecksIcon,
	SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { issueViewsQueryOptions } from "#/features/issues/queries";
import {
	issueSearchDefaults,
	searchFromViewConfig,
} from "#/features/issues/view-search";
import { workspacesQueryOptions } from "#/features/workspaces/queries";
import type { WorkspaceListItem } from "#/types/workspace";
import UserMenu, { type UserMenuUser } from "./UserMenu";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "./ui/sidebar";

type AppSidebarProps = {
	workspace: {
		name: string;
		code: string;
		color: string;
	};
	user: UserMenuUser;
};

const EMPTY_WORKSPACES: WorkspaceListItem[] = [];

export default function AppSidebar({ workspace, user }: AppSidebarProps) {
	const [openWorkspaceSwitch, setOpenWorkspaceSwitch] = useState(false);
	const location = useLocation();
	const { isMobile } = useSidebar();
	const { data: workspaces = EMPTY_WORKSPACES } = useQuery(
		workspacesQueryOptions,
	);
	const { data: issueViews = [] } = useQuery(
		issueViewsQueryOptions(workspace.code),
	);
	const search = useSearch({ strict: false });
	const overviewPath = `/app/${workspace.code}`;
	const issuesPath = `${overviewPath}/issues`;
	const documentsPath = `${overviewPath}/documents`;
	const settingsPath = `${overviewPath}/settings`;

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<Popover
							open={openWorkspaceSwitch}
							onOpenChange={setOpenWorkspaceSwitch}
						>
							<PopoverTrigger asChild>
								<SidebarMenuButton isActive={openWorkspaceSwitch}>
									<span
										className="size-3 rounded-full shrink-0"
										style={{ background: workspace.color }}
									/>
									<span className="truncate">{workspace.name}</span>
									<ChevronDownIcon className="ml-auto" />
								</SidebarMenuButton>
							</PopoverTrigger>
							<PopoverContent align="start" className="w-64 p-1">
								<p className="px-2 py-1.5 text-xs text-muted-foreground">
									Switch workspace
								</p>
								{workspaces.map((item) => (
									<Link
										key={item.id}
										to="/app/$code"
										params={{ code: item.code }}
										className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
										onClick={() => setOpenWorkspaceSwitch(false)}
									>
										<span
											className="size-3 rounded-full"
											style={{ background: item.color }}
										/>
										<span className="truncate flex-1">{item.name}</span>
										{item.code === workspace.code ? (
											<Badge variant="secondary" className="text-[10px]">
												Current
											</Badge>
										) : (
											<span className="font-mono text-xs text-muted-foreground">
												{item.code}
											</span>
										)}
									</Link>
								))}
								<Separator className="my-1" />
								<Link
									to="/app"
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
									onClick={() => setOpenWorkspaceSwitch(false)}
								>
									<CircleIcon className="size-3" />
									All workspaces
								</Link>
							</PopoverContent>
						</Popover>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={
										location.pathname === overviewPath && search.viewId == null
									}
								>
									<Link to="/app/$code" params={{ code: workspace.code }}>
										<LayoutGridIcon />
										Overview
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={
										location.pathname.startsWith(issuesPath) &&
										search.viewId == null
									}
								>
									<Link
										to="/app/$code/issues"
										params={{ code: workspace.code }}
										search={issueSearchDefaults}
									>
										<ListChecksIcon />
										Issues
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={location.pathname.startsWith(documentsPath)}
								>
									<Link
										to="/app/$code/documents"
										params={{ code: workspace.code }}
									>
										<FileTextIcon />
										Documents
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={location.pathname.startsWith(settingsPath)}
								>
									<Link
										to="/app/$code/settings"
										params={{ code: workspace.code }}
									>
										<SettingsIcon />
										Settings
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				{issueViews.length > 0 ? (
					<SidebarGroup>
						<SidebarGroupLabel>Views</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{issueViews.map((view) => (
									<SidebarMenuItem key={view.id}>
										<SidebarMenuButton
											asChild
											isActive={
												(location.pathname === overviewPath ||
													location.pathname.startsWith(issuesPath)) &&
												search.viewId === view.id
											}
										>
											<Link
												to="/app/$code/issues"
												params={{ code: workspace.code }}
												search={searchFromViewConfig(view.id, view.config)}
											>
												<span className="truncate">{view.name}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				) : null}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<UserMenu
							user={user}
							variant="sidebar"
							side={isMobile ? "bottom" : "right"}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
