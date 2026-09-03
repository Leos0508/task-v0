import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import Logo from "./Logo";

export default function LandingNavbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6">
      <Link
        to="/"
        className="font-heading text-lg font-semibold tracking-tight"
      >
        <Logo className="w-24 h-16 text-foreground" />
      </Link>
      <nav className="flex items-center gap-2">
        {isLoggedIn ? (
          <Button asChild>
            <Link to="/app">
              Dashboard <ArrowRightIcon />
            </Link>
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
