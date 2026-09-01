import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
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
import { authClient } from "#/lib/auth-client";

export type UserMenuUser = {
	name: string;
	email: string;
	image?: string | null;
};

function userInitials(name: string, email: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		const first = parts[0] ?? "";
		const second = parts[1] ?? "";
		return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
	}
	if (parts[0]) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return email.slice(0, 2).toUpperCase() || "?";
}

function UserIdentity({ user }: { user: UserMenuUser }) {
	return (
		<>
			<Avatar>
				<AvatarImage src={user.image ?? undefined} alt={user.name} />
				<AvatarFallback>{userInitials(user.name, user.email)}</AvatarFallback>
			</Avatar>
			<div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
				<span className="truncate font-medium">{user.name}</span>
				<span className="truncate text-xs font-normal text-muted-foreground">
					{user.email}
				</span>
			</div>
		</>
	);
}

type UserMenuProps = {
	user: UserMenuUser;
	variant?: "sidebar" | "header";
	side?: "top" | "right" | "bottom" | "left";
};

export default function UserMenu({
	user,
	variant = "header",
	side,
}: UserMenuProps) {
	const [isSigningOut, setIsSigningOut] = useState(false);
	const navigate = useNavigate();

	async function handleSignOut() {
		setIsSigningOut(true);
		try {
			await authClient.signOut(
				{},
				{
					onSuccess: () => {
						toast.success("Sign out success");
						navigate({ to: "/sign-in" });
					},
					onError: (ctx) => {
						toast.error(`Failed to sign out: ${ctx.error.message}`);
					},
				},
			);
		} finally {
			setIsSigningOut(false);
		}
	}

	const trigger =
		variant === "sidebar" ? (
			<SidebarMenuButton
				size="lg"
				tooltip={user.name}
				disabled={isSigningOut}
				className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
			>
				<UserIdentity user={user} />
				<ChevronsUpDownIcon className="ml-auto size-4" />
			</SidebarMenuButton>
		) : (
			<Button
				variant="ghost"
				disabled={isSigningOut}
				className="h-12 max-w-64 justify-start gap-2 px-2 data-[state=open]:bg-muted"
			>
				<UserIdentity user={user} />
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
						<UserIdentity user={user} />
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					disabled={isSigningOut}
					onSelect={() => {
						void handleSignOut();
					}}
				>
					<LogOutIcon />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
