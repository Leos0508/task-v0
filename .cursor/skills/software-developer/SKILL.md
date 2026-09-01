---
name: software-developer
description: Engineering standards for this workspace/issue tracker. Use when implementing features, reviewing code, designing data access, handling errors, or choosing libraries.
---

# Software developer

Build a workspace issue tracker on TanStack Start, Drizzle, and better-auth.

## Product

- Workspaces have members (`MEMBER` < `ADMIN` < `OWNER`) and invites.
- Issues are numbered per workspace. Documents are workspace-scoped. Issues and documents link many-to-many.
- Hide workspace existence from non-members (`NOT_FOUND`, not `FORBIDDEN`, for missing membership).

## Architecture

- Persistence: Drizzle + PostgreSQL in `src/db`. Do not add Prisma.
- Auth: better-auth + Drizzle adapter. Session reads go through `getSession` / `getAuthSession`.
- Mutations and privileged reads: `createServerFn` in `src/lib/functions/*.functions.ts`.
- Client reads: TanStack Query options whose `queryFn` calls a server function. Do not add REST `/api/*` routes except better-auth.
- Authorization: `getWorkspaceAccess` + `src/lib/authz/roles.ts`. Never trust the client for role checks.

## Errors

- Domain failures use `AppError` / `ActionResult` from `src/types/result.ts`.
- Unique violations are PostgreSQL `23505`, not Prisma `P2002`.
- Unauthorized session throws `Error("Unauthorized")` so `mapActionError` can map it.

## Libraries

Prefer TanStack over extra packages:

| Need | Use |
|------|-----|
| Routing, search, loaders, redirects | `@tanstack/react-router` |
| SSR + RPC | `@tanstack/react-start` (`createServerFn`, `createServerOnlyFn`) |
| Client/server cache | `@tanstack/react-query` + route `loader` `ensureQueryData` |
| Forms | `@tanstack/react-form` + Zod |
| Tables | `@tanstack/react-table` + `src/lib/data-table.ts` |
| Dates | `Intl.DateTimeFormat` — do not add `date-fns` |
| Rich text | TipTap (no TanStack equivalent) |

Do not add Next.js APIs (`next/link`, `next/navigation`, `"use server"`, `revalidatePath`).
