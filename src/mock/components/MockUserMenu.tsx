import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDownIcon, KeyRoundIcon, LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { SidebarMenuButton } from "#/components/ui/sidebar";
import { MOCK_USER } from "#/mock/fixtures";

function UserIdentity() {
	return (
		<>
			<Avatar>
				<AvatarFallback>NC</AvatarFallback>
			</Avatar>
			<div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
				<span className="truncate font-medium">{MOCK_USER.name}</span>
				<span className="truncate text-xs font-normal text-muted-foreground">
					{MOCK_USER.email}
				</span>
			</div>
		</>
	);
}

export default function MockUserMenu({
	variant = "header",
	side,
}: {
	variant?: "sidebar" | "header";
	side?: "top" | "right" | "bottom" | "left";
}) {
	const navigate = useNavigate();

	const trigger =
		variant === "sidebar" ? (
			<SidebarMenuButton
				size="lg"
				tooltip={MOCK_USER.name}
				className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
			>
				<UserIdentity />
				<ChevronsUpDownIcon className="ml-auto size-4" />
			</SidebarMenuButton>
		) : (
			<Button
				variant="ghost"
				className="h-12 max-w-64 justify-start gap-2 px-2 data-[state=open]:bg-muted"
			>
				<UserIdentity />
				<ChevronsUpDownIcon className="ml-auto size-4" />
			</Button>
		);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
			<DropdownMenuContent
				className="min-w-56"
				side={side ?? (variant === "sidebar" ? "right" : "bottom")}
				align="end"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<UserIdentity />
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={() => {
						navigate({ to: "/mock/app/account" });
					}}
				>
					<KeyRoundIcon />
					API keys
				</DropdownMenuItem>
				<DropdownMenuItem
					onSelect={() => {
						toast.success("Signed out of mock");
						navigate({ to: "/mock/sign-in" });
					}}
				>
					<LogOutIcon />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
