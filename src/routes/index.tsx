import { createFileRoute } from "@tanstack/react-router";
import LandingNavbar from "#/components/LandingNavbar";
import { getAuthSession } from "#/lib/auth.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const session = await getAuthSession();
    return {
      isLoggedIn: Boolean(session),
      ownerEmail: process.env.OWNER_EMAIL,
    };
  },
  head: () => ({
    meta: [{ title: "Task" }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { isLoggedIn, ownerEmail } = Route.useLoaderData();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background">
      <LandingNavbar isLoggedIn={isLoggedIn} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
        <p className="font-heading text-4xl font-semibold tracking-tight">
          A personal workspace for issues and documents
        </p>
        <p className="max-w-xl text-muted-foreground">
          This project was made to demonstrate a simple task management
          application with multi tenant features. <br />
          <br />
          Contact me at{" "}
          <a
            href={`mailto:${ownerEmail}`}
            className="underline hover:cursor-pointer hover:text-accent-foreground"
          >
            {ownerEmail}
          </a>{" "}
          for more information.{" "}
        </p>
      </main>
    </div>
  );
}
