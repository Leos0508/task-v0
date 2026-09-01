---
name: react-development
description: React 19 patterns for this TanStack Start app. Use when writing or reviewing components, forms, tables, editors, or client/server boundaries.
---

# React development

## Execution model

TanStack Start is isomorphic. Components run on server and client unless the work is inside `createServerFn` / `createServerOnlyFn`.

- Do not use `"use client"` or `"use server"`.
- Keep DB, cookies, and Node APIs out of components.
- TipTap and other browser-only editors: lazy-load and render only after mount (or `ClientOnly`).

## Components

- Function components. Derive values during render; do not sync props into state with effects.
- Use `#/` imports (`#/components/ui/button`).
- shadcn/ui + Tailwind. Install with `npx shadcn@latest add <name>`.
- Accessibility: labels on inputs, `aria-invalid` from form meta, do not use `&&` for conditional UI that can render `0`.

## Data in UI

- Route `loader` prefetches Query: `context.queryClient.ensureQueryData(...)`.
- Components call `useQuery` / `useSuspenseQuery` with the same options. After mutations, `queryClient.invalidateQueries`.
- Do not use `router.refresh()` or `revalidatePath`.
- Optimistic table edits are allowed if the server function is the source of truth on failure.

## Forms

TanStack Form + Zod. Auto-save editors debounce (~700ms) and skip unchanged JSON snapshots.

## Navigation

```tsx
import { Link, useNavigate, useLocation } from "@tanstack/react-router"

<Link to="/workspaces/$code" params={{ code: workspace.code }}>Issues</Link>
```

Never interpolate into `to`. Use `params` and `search`.
