import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

export default function LandingNavbar({ isLoggedIn }: { isLoggedIn: boolean }) {
	return (
		<header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6">
			<Link
				to="/"
				className="font-heading text-lg font-semibold tracking-tight"
			>
				Task
			</Link>
			<nav className="flex items-center gap-2">
				{isLoggedIn ? (
					<Button asChild>
						<Link to="/app">To app</Link>
					</Button>
				) : (
					<>
						<Button variant="ghost" asChild>
							<Link to="/sign-in">Sign in</Link>
						</Button>
						<Button asChild>
							<Link to="/sign-up">Sign up</Link>
						</Button>
					</>
				)}
			</nav>
		</header>
	);
}
