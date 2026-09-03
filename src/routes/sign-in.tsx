import Logo from "#/components/Logo";
import SignInForm from "#/components/SignInForm";
import { safeInternalPath } from "#/lib/safe-path";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/sign-in")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect: redirectTo } = Route.useSearch();

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden">
      <div className="flex w-1/3 bg-primary text-primary-foreground h-full items-start justify-center p-8 flex-col">
        <Link to="/">
          <Logo className="w-48 h-24 text-primary-foreground" />
        </Link>
        <p className="text-sm">
          This project was made to demonstrate a simple task management
          application with multi tenant features.
        </p>
      </div>
      <div className="flex w-2/3 h-full items-center justify-center bg-accent text-accent-foreground p-8">
        <SignInForm next={safeInternalPath(redirectTo)} />
      </div>
    </div>
  );
}
