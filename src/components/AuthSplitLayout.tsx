import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import Logo from "#/components/Logo";

export default function AuthSplitLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex h-screen w-screen items-center justify-center overflow-hidden">
			<div className="flex h-full w-1/3 flex-col items-start justify-center bg-primary p-8 text-primary-foreground">
				<Link to="/">
					<Logo className="h-24 w-48 text-primary-foreground" />
				</Link>
				<p className="text-sm">
					This project was made to demonstrate a simple task management
					application with multi tenant features.
				</p>
			</div>
			<div className="flex h-full w-2/3 items-center justify-center bg-accent p-8 text-accent-foreground">
				{children}
			</div>
		</div>
	);
}
