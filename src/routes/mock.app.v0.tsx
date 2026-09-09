import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";
import MockAppSidebar from "#/mock/components/MockAppSidebar";

export const Route = createFileRoute("/mock/app/v0")({
	component: MockWorkspaceLayout,
});

function MockWorkspaceLayout() {
	return (
		<SidebarProvider>
			<MockAppSidebar />
			<SidebarInset>
				<div className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
					<SidebarTrigger />
					<span className="font-heading text-lg font-semibold">Task</span>
				</div>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
