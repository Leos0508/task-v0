import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import Logo from "#/components/Logo";
import { Button } from "#/components/ui/button";

export default function MockLandingNavbar() {
	return (
		<header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6">
			<Link
				to="/mock"
				className="font-heading text-lg font-semibold tracking-tight"
			>
				<Logo className="h-16 w-24 text-foreground" />
			</Link>
			<nav className="flex items-center gap-2">
				<Button variant="ghost" asChild>
					<Link to="/mock/sign-in">Sign in</Link>
				</Button>
				<Button asChild>
					<Link to="/mock/sign-up">Sign up</Link>
				</Button>
				<Button variant="secondary" asChild>
					<Link to="/mock/app">
						Dashboard <ArrowRightIcon />
					</Link>
				</Button>
			</nav>
		</header>
	);
}
