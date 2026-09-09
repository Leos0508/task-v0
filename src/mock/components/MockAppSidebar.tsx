import { Link, useLocation } from "@tanstack/react-router";
import {
	ChevronDownIcon,
	CircleIcon,
	FileTextIcon,
	LayoutGridIcon,
	ListChecksIcon,
	SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Separator } from "#/components/ui/separator";
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
} from "#/components/ui/sidebar";
import MockUserMenu from "#/mock/components/MockUserMenu";
import { mockWorkspace, mockWorkspaces } from "#/mock/fixtures";

export default function MockAppSidebar() {
	const [openWorkspaceSwitch, setOpenWorkspaceSwitch] = useState(false);
	const location = useLocation();
	const { isMobile } = useSidebar();
	const overviewPath = "/mock/app/v0";
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
										className="size-3 shrink-0 rounded-full"
										style={{ background: mockWorkspace.color }}
									/>
									<span className="truncate">{mockWorkspace.name}</span>
									<ChevronDownIcon className="ml-auto" />
								</SidebarMenuButton>
							</PopoverTrigger>
							<PopoverContent align="start" className="w-64 p-1">
								<p className="px-2 py-1.5 text-xs text-muted-foreground">
									Switch workspace
								</p>
								{mockWorkspaces.map((item) => (
									<Link
										key={item.id}
										to="/mock/app/v0"
										className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
										onClick={() => setOpenWorkspaceSwitch(false)}
									>
										<span
											className="size-3 rounded-full"
											style={{ background: item.color }}
										/>
										<span className="truncate flex-1">{item.name}</span>
										{item.code === mockWorkspace.code ? (
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
									to="/mock/app"
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
									isActive={location.pathname === overviewPath}
								>
									<Link to="/mock/app/v0">
										<LayoutGridIcon />
										Overview
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={location.pathname.startsWith(issuesPath)}
								>
									<Link to="/mock/app/v0/issues">
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
									<Link to="/mock/app/v0/documents">
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
									<Link to="/mock/app/v0/settings">
										<SettingsIcon />
										Settings
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<MockUserMenu
							variant="sidebar"
							side={isMobile ? "bottom" : "right"}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
