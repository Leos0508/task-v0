# Mock UI plan — editorial aesthetic, current layout

> The `/mock` route tree was removed after this look shipped on production. This document is the original plan (kept as written).

## Goal

Build a **clickable mock** of the existing app so we can judge a visual redo. Take the **look** from `docs/design-reference/` (warm paper, serif titles, pastel tags, black pill actions). Keep the **information architecture and page layout** from [`docs/ui-catalog.md`](./ui-catalog.md). No API, no auth, no `createServerFn`. Static fixtures only.

Do **not** restyle production `/`, `/sign-in`, `/app`. Scope the theme to a `/mock` tree so the live app stays unchanged until we like the mock.

## Source of truth

| Source | Use |
|--------|-----|
| [`docs/ui-catalog.md`](./ui-catalog.md) | Routes, shells, primitives, feature surfaces |
| [`docs/design-reference/`](./design-reference/) | Color, type, radius, cards, tags, mobile chrome |
| Current components | Reuse `#/components/ui/*` and the same shells (sidebar + inset, `dashboard-page`, `detail-form-layout`) |

## What to copy from the designs (aesthetic)

Screenshots: `01_home` … `13_mobile_issues` plus README in `docs/design-reference/`.

- **Paper canvas:** warm off-white / cream page (`~#F7F5F0`), slightly different sidebar wash, white cards.
- **Type:** serif for page titles and large document/issue titles; Inter (existing `--font-sans`) for UI, metadata, body. Small-caps / tracked labels (`TASK-12`, `WORKSPACE`).
- **Primary:** near-black filled buttons, generous rounding (pill or ~12–16px), not the current purple primary.
- **Tags:** muted pastel pills (mint, lavender, pale yellow, sky) with darker same-hue text — map existing tag colors into this set in fixtures.
- **Surfaces:** thin light borders, almost no shadow; empty board columns as dashed placeholders.
- **Mobile:** hamburger + “Task” header; sidebar as overlay `Sheet` (already used by `Sidebar`).

## What not to copy from the designs (layout / product)

The design is a different product shell. Do **not**:

- Make workspace home a documents grid + issue cards mashup.
- Put a document list, tag cloud, or “Reset seed” in the sidebar.
- Replace issue detail with a right drawer as the only view (keep full-page `detail-form-layout` from the catalog).
- Rename statuses to Backlog / In progress / Done. Keep `TODO` | `IN_PROGRESS` | `DONE` | `CANCELLED`.
- Drop Settings, Account, Gantt, list table, members, API keys, landing, or auth pages.
- Invent a second Button/Input/Card. Restyle via tokens + existing primitives (`Dialog` for new issue is fine — catalog lists it unused).

## Target IA (mirror catalog)

Mock URLs (no `$code` auth). Use a single fixture workspace `v0`:

| Mock URL | Mirrors | Notes |
|----------|---------|--------|
| `/mock` | Landing | Editorial landing; CTA to `/mock/app` |
| `/mock/sign-in` | Sign-in | Split layout; form does not submit; “Continue” → `/mock/app` |
| `/mock/sign-up` | Sign-up | Same |
| `/mock/app` | Workspaces list | Table/cards of fixture workspaces; UserMenu does not call auth |
| `/mock/app/create-workspace` | Create workspace | Local form only |
| `/mock/app/account` | Account | Fake API keys list |
| `/mock/app/v0` | Overview | Same header + `IssueViewTabs` + `IssueList` layout; search `view` |
| `/mock/app/v0/issues` | Issues | Same as overview |
| `/mock/app/v0/issues/1` | Issue detail | `IssueDetailForm` layout; editor can be a static/readonly mock if TipTap is heavy |
| `/mock/app/v0/documents` | Documents | DataTable layout |
| `/mock/app/v0/documents/welcome` | Document detail | Same two-column detail layout |
| `/mock/app/v0/settings` | Settings | Tabs: general / members / danger |
| `/mock/invites/demo` | Invite | Accept card, no token fetch |

Keep list / board / gantt via search params like production. Gantt: simplified static bars, not the real scheduler, unless reusing the component with fixture rows is easy.

## Implementation

1. **Theme wrapper** — `/mock` layout adds class `mock-editorial` on a full-height wrapper. In `src/styles.css`, nest token overrides under `.mock-editorial` (`--background`, `--primary` near black, `--radius` slightly larger, `--font-heading` a serif loaded in mock layout only, e.g. Source Serif 4). Do not change `:root` globally.

2. **Fixtures** — `src/mock/fixtures.ts`: 2–3 workspaces, ~6 issues across statuses, 3 documents, tags, members, comments, history snippets, fake API keys. Typed loosely to match list/detail props.

3. **Routes** — `src/routes/mock*.tsx` (file routes). No `getAuthSession`, no `ensureQueryData`. `beforeLoad` is empty. `Link`/`navigate` only inside `/mock`.

4. **Chrome** — Mock copies of `AppSidebar`, `UserMenu`, `LandingNavbar` that `Link` to `/mock/...` and never call `authClient`. Prefer thin wrappers over forking entire feature forms if props can be satisfied with fixtures. If a form requires Query/server fns, build a presentational mock page that **looks** like the catalog screen (same regions: header, separator, table/board/aside) using the same ui primitives.

5. **New issue** — Production creates then navigates. Mock: `Dialog` (“New issue”) matching design `10_new_issue.png`, then navigate to a fixture detail. Do not hit `createIssueFn`.

6. **Editor** — Do not rebuild TipTap from the design toolbar. Mock body as typography + a disabled toolbar row for look. Slash/mermaid out of scope.

7. **Catalog** — Add a “Mock” section to `docs/ui-catalog.md` listing `/mock` URLs.

8. **Quality** — `pnpm typecheck` / biome on touched files. Do not add Storybook.

## Order of work

1. Tokens + mock layout + landing + sign-in (proves theme).
2. Workspace sidebar shell + workspaces list + account.
3. Issues list + board (+ light gantt).
4. Issue detail + new-issue dialog.
5. Documents list + document detail.
6. Settings tabs + invite.
7. Mobile: sidebar collapse / sheet, check 375px on home, issues, sidebar.

## Done when

Someone can click `/mock` through the catalog pages without a database, the layout matches today’s app (sidebar + inset, page headers, detail two-column), and the look matches the design reference (paper, serif titles, pastel tags, black actions).
