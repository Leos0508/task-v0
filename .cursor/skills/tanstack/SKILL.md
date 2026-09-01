---
name: tanstack
description: TanStack Start/Router/Query/Form/Table conventions for this project. Use when adding routes, server functions, loaders, search params, tables, or migrating Next.js patterns.
---

# TanStack conventions

Load official intents when needed (`npx @tanstack/intent@latest load ...`). This skill is the project overlay.

## Routes

| URL | File |
|-----|------|
| `/` | `src/routes/index.tsx` |
| `/sign-in` | `src/routes/sign-in.tsx` |
| `/workspaces` | `src/routes/workspaces.tsx` (auth layout) + `workspaces.index.tsx` |
| `/workspaces/$code` | `src/routes/workspaces.$code.tsx` (sidebar layout) |
| `/workspaces/$code/issues/$issueNumber` | `src/routes/workspaces.$code.issues.$issueNumber.tsx` |
| `/invites/$token` | `src/routes/invites.$token.tsx` |

- Auth: `beforeLoad` + `getAuthSession()` + `throw redirect({ to: "/sign-in", search: { redirect: location.href } })`.
- Workspace pages: `beforeLoad` calls `getWorkspaceAccessFn`; missing access → `throw notFound()`.
- Pending UI: `pendingComponent` (e.g. `PageLoading`).
- Head/title: route `head`, not Next `metadata`.
- Search: `validateSearch` with Zod (`redirect` on sign-in).

## Server functions

```ts
export const listWorkspacesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => fetchWorkspaces(context.user.id))
```

- GET for reads, POST for mutations.
- `.validator(zodSchema)` for input.
- `.middleware([authMiddleware])` so `context.user` is set.
- Return `ActionResult<T>` from mutations (same shape as the Next.js app).
- Invalidate Query keys after success. Do not call `revalidatePath`.

## Query

```ts
export const workspacesQueryOptions = queryOptions({
  queryKey: workspaceKeys.all,
  queryFn: () => listWorkspacesFn(),
})
```

Prefetch in loaders with `ensureQueryData`. `setupRouterSsrQueryIntegration` is already in `src/router.tsx`.

## Table

Use `useAppTable` / `createAppColumnHelper` from `#/lib/data-table` (v9 `createTableHook`). Render with `#/components/ui/data-table`.

## Next.js → Start

| Next.js | This app |
|---------|----------|
| `page.tsx` | `createFileRoute` |
| `layout.tsx` | parent route + `<Outlet />` |
| `"use server"` | `createServerFn` |
| `headers()` + `getSession` | `getSession()` / auth middleware |
| `redirect` / `notFound` | `throw redirect()` / `throw notFound()` |
| `useRouter().push` | `useNavigate()` |
| `usePathname` | `useLocation()` |
| `next/link` | `Link` from `@tanstack/react-router` |
| `next/dynamic ssr:false` | lazy + client-only mount |
| REST query `fetch('/api/...')` | server fn as `queryFn` |
