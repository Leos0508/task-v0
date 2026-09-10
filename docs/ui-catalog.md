# UI catalog

Agent source of truth for this app’s UI. Read this before adding or restyling screens.

**Not** a published shadcn registry. **Not** Figma Code Connect. Figma (when used) is visual intent; remap to the components listed here. Do not paste generated JSX that invents a second Button, Dialog, or table.

When you add, rename, or delete a UI surface, update this file in the same change.

Status for a future UI redo:

| Status | Meaning |
|--------|---------|
| keep | Reuse; restyle via tokens/variants, do not fork |
| wrap | Restyle/compose in place; do not regenerate from a Figma frame |
| replace | Chrome likely rewritten in a redo |
| unused | Installed, no product import yet |

Imports use `#/` (`#/components/ui/button`). Forms: TanStack Form + Zod. Tables: `useAppTable` from [`src/lib/data-table.ts`](../src/lib/data-table.ts) + [`DataTable`](../src/components/ui/data-table.tsx). Toasts: `toast` from `sonner` (root mounts `<Toaster />` from `sonner`, not [`ui/sonner`](../src/components/ui/sonner.tsx)).

---

## 1. App snapshot — layouts

| Layout | URL | File | Shell | Children |
|--------|-----|------|-------|----------|
| Root | `*` | [`src/routes/__root.tsx`](../src/routes/__root.tsx) | Document, fonts, [`PageLoading`](../src/components/PageLoading.tsx) / [`PageError`](../src/components/PageError.tsx) / [`PageNotFound`](../src/components/PageNotFound.tsx), Sonner, Devtools | All routes |
| Auth app | `/app` | [`src/routes/app.tsx`](../src/routes/app.tsx) | Session `beforeLoad`; unauthenticated → `/sign-in?redirect=` | Workspace picker, account, create workspace, `$code` |
| Workspace | `/app/$code` | [`src/routes/app.$code.tsx`](../src/routes/app.$code.tsx) | [`SidebarProvider`](../src/components/ui/sidebar.tsx) + [`AppSidebar`](../src/components/AppSidebar.tsx) + `SidebarInset`; access via `getWorkspaceAccessFn`; missing membership → `notFound()` | Overview, issues, documents, settings |

Shared layout classes (critical CSS in root): `.dashboard-page`, `.detail-form-layout`, `.detail-form-main`, `.detail-form-aside`, `.tiptap-editor`. Tokens live in [`src/styles.css`](../src/styles.css) (editorial paper canvas, near-black primary, Space Grotesk headings).

---

## 2. App snapshot — pages

| Page | URL | Route file | Primary UI | Features |
|------|-----|------------|------------|----------|
| Landing | `/` | [`src/routes/index.tsx`](../src/routes/index.tsx) | [`LandingNavbar`](../src/components/LandingNavbar.tsx) | Marketing copy; session-aware CTA |
| Sign in | `/sign-in` | [`src/routes/sign-in.tsx`](../src/routes/sign-in.tsx) | [`Logo`](../src/components/Logo.tsx), [`SignInForm`](../src/components/SignInForm.tsx) | [`src/features/auth/schema.ts`](../src/features/auth/schema.ts); search `redirect` |
| Sign up | `/sign-up` | [`src/routes/sign-up.tsx`](../src/routes/sign-up.tsx) | [`Logo`](../src/components/Logo.tsx), [`SignUpForm`](../src/components/SignUpForm.tsx) | Same auth schema |
| Workspaces | `/app/` | [`src/routes/app.index.tsx`](../src/routes/app.index.tsx) | [`UserMenu`](../src/components/UserMenu.tsx), [`WorkspaceList`](../src/features/workspaces/components/WorkspaceList.tsx) | [Workspaces](#workspaces) |
| Create workspace | `/app/create-workspace` | [`src/routes/app.create-workspace.tsx`](../src/routes/app.create-workspace.tsx) | [`CreateWorkspaceForm`](../src/features/workspaces/components/CreateWorkspaceForm.tsx) | [Workspaces](#workspaces) |
| Account / API keys | `/app/account` | [`src/routes/app.account.tsx`](../src/routes/app.account.tsx) | [`UserMenu`](../src/components/UserMenu.tsx), [`ApiKeysPanel`](../src/features/account/components/ApiKeysPanel.tsx) | [Account](#account) |
| Workspace overview | `/app/$code/` | [`src/routes/app.$code.index.tsx`](../src/routes/app.$code.index.tsx) | [`IssueViewTabs`](../src/features/issues/components/IssueViewTabs.tsx), [`IssueList`](../src/features/issues/components/IssueList.tsx) | [Issues](#issues) — same views as Issues page |
| Issues | `/app/$code/issues/` | [`src/routes/app.$code.issues.index.tsx`](../src/routes/app.$code.issues.index.tsx) | Same as overview | [Issues](#issues) |
| Issue detail | `/app/$code/issues/$issueNumber` | [`src/routes/app.$code.issues.$issueNumber.tsx`](../src/routes/app.$code.issues.$issueNumber.tsx) | [`IssueDetailForm`](../src/features/issues/components/IssueDetailForm.tsx) | Issues, comments, tags, linked docs, history |
| Documents | `/app/$code/documents/` | [`src/routes/app.$code.documents.index.tsx`](../src/routes/app.$code.documents.index.tsx) | [`DocumentList`](../src/features/documents/components/DocumentList.tsx) | [Documents](#documents) |
| Document detail | `/app/$code/documents/$documentId` | [`src/routes/app.$code.documents.$documentId.tsx`](../src/routes/app.$code.documents.$documentId.tsx) | [`DocumentDetailForm`](../src/features/documents/components/DocumentDetailForm.tsx) | Documents, tags, linked issues, history |
| Settings | `/app/$code/settings` | [`src/routes/app.$code.settings.tsx`](../src/routes/app.$code.settings.tsx) | Tabs: [`WorkspaceGeneralForm`](../src/features/settings/components/WorkspaceGeneralForm.tsx), [`MembersPanel`](../src/features/settings/components/MembersPanel.tsx), [`DeleteWorkspaceCard`](../src/features/settings/components/DeleteWorkspaceCard.tsx) | [Settings](#settings) |
| Accept invite | `/invites/$token` | [`src/routes/invites.$token.tsx`](../src/routes/invites.$token.tsx) | [`AcceptInviteCard`](../src/features/settings/components/AcceptInviteCard.tsx) | Auth required; invalid token empty state |

Path-only layouts (outlet only): [`app.$code.issues.tsx`](../src/routes/app.$code.issues.tsx), [`app.$code.documents.tsx`](../src/routes/app.$code.documents.tsx).

Search on overview + issues: `view` (`list` \| `board` \| `gantt`), `viewId`, `status[]`, `priority[]`, `tag[]`, `sort`, `dir`, `graph`, `groupBy` — [`src/features/issues/view-search.ts`](../src/features/issues/view-search.ts). Search on documents: `sort`, `dir` — [`src/features/documents/schema.ts`](../src/features/documents/schema.ts). List/gantt share issue sort; board hides the sort popover and stays rank-ordered. Toolbar sort is [`ListSortPopover`](../src/components/ListSortPopover.tsx); table headers that map to a sort field toggle the same `sort`/`dir`.

---

## 3. App snapshot — non-page routes

| URL | File | Role |
|-----|------|------|
| `/workspaces`, `/workspaces/$` | [`workspaces.tsx`](../src/routes/workspaces.tsx), [`workspaces.$.tsx`](../src/routes/workspaces.$.tsx) | Redirect `/workspaces` → `/app` |
| `/files/$fileId` | [`files.$fileId.ts`](../src/routes/files.$fileId.ts) | Authenticated file GET from uploads bucket |
| `/api/auth/$` | [`api/auth/$.ts`](../src/routes/api/auth/$.ts) | better-auth |
| `/api/mcp` | [`api/mcp.ts`](../src/routes/api/mcp.ts) | MCP HTTP; API key auth — [`src/mcp/server.ts`](../src/mcp/server.ts) |

MCP tools (no UI): `list_workspaces`, `get_workspace`, `list_issues`, `get_issue`, `create_issue`, `update_issue`, `list_tags`, `create_tag`, `update_tag`, `link_tag`, `unlink_tag`, `link_document_tag`, `unlink_document_tag`, `list_comments`, `create_comment`, `list_issue_history`, `list_documents`, `get_document`, `create_document`, `update_document`, `list_document_history`. Keys are managed on [Account](#account).

---

## 4. Features

### Workspaces

Multi-tenant spaces (`code`, `name`, `color`). List/create/switch.

| Piece | File |
|-------|------|
| Queries | [`src/features/workspaces/queries.ts`](../src/features/workspaces/queries.ts) |
| Schema | [`src/features/workspaces/schema.ts`](../src/features/workspaces/schema.ts) |
| List table | [`WorkspaceList.tsx`](../src/features/workspaces/components/WorkspaceList.tsx) |
| Columns | [`workspace-columns.tsx`](../src/features/workspaces/components/workspace-columns.tsx) |
| Create form | [`CreateWorkspaceForm.tsx`](../src/features/workspaces/components/CreateWorkspaceForm.tsx) |
| Server | [`src/lib/functions/workspaces.functions.ts`](../src/lib/functions/workspaces.functions.ts) |
| Switcher UI | [`AppSidebar.tsx`](../src/components/AppSidebar.tsx) |

**Screens:** [Workspaces](#2-app-snapshot--pages), [Create workspace](#2-app-snapshot--pages), workspace layout.

### Issues

Numbered per workspace. Status: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`. Priority: `LOW`–`URGENT` or none. Layouts: list table, board, Gantt. Named workspace views persist default filters, sort, layout, and graph. Session edits stay in the URL until **Update view**.

| Piece | File |
|-------|------|
| List + create | [`IssueList.tsx`](../src/features/issues/components/IssueList.tsx) |
| Saved views | [`IssueViewControls.tsx`](../src/features/issues/components/IssueViewControls.tsx), [`IssueSaveViewDialog.tsx`](../src/features/issues/components/IssueSaveViewDialog.tsx) |
| View tabs | [`IssueViewTabs.tsx`](../src/features/issues/components/IssueViewTabs.tsx) |
| Filters | [`IssueFiltersPopover.tsx`](../src/features/issues/components/IssueFiltersPopover.tsx) |
| Sort | [`ListSortPopover.tsx`](../src/components/ListSortPopover.tsx) — issues, documents, workspaces |
| Chart panel | [`IssueChartPanel.tsx`](../src/features/issues/components/IssueChartPanel.tsx) (lazy; Recharts via [`chart.tsx`](../src/components/ui/chart.tsx)) |
| Table | [`IssueTableView.tsx`](../src/features/issues/components/IssueTableView.tsx), [`issue-columns.tsx`](../src/features/issues/components/issue-columns.tsx) |
| Board | [`IssueBoardView.tsx`](../src/features/issues/components/IssueBoardView.tsx), [`reorder-issue.ts`](../src/features/issues/reorder-issue.ts) |
| Gantt | [`IssueGanttView.tsx`](../src/features/issues/components/IssueGanttView.tsx) (lazy) |
| Detail | [`IssueDetailForm.tsx`](../src/features/issues/components/IssueDetailForm.tsx) |
| Editor | [`IssueEditor.tsx`](../src/features/issues/components/IssueEditor.tsx) + slash/mermaid/clipboard helpers in same folder |
| Status/priority | [`IssueBadges.tsx`](../src/features/issues/components/IssueBadges.tsx) |
| Tags on issue | [`IssueTags.tsx`](../src/features/issues/components/IssueTags.tsx), [`IssueTagBadge.tsx`](../src/features/issues/components/IssueTagBadge.tsx), [`IssueListTags.tsx`](../src/features/issues/components/IssueListTags.tsx) (list/board: up to 2 badges, else one `+N` popover) |
| Comments | [`IssueComments.tsx`](../src/features/issues/components/IssueComments.tsx) |
| Linked docs | [`IssueLinkedDocuments.tsx`](../src/features/issues/components/IssueLinkedDocuments.tsx) |
| Patch helpers | [`patch-issue.ts`](../src/features/issues/patch-issue.ts) |
| Server | [`issues.functions.ts`](../src/lib/functions/issues.functions.ts), [`issue-views.functions.ts`](../src/lib/functions/issue-views.functions.ts), [`comments.functions.ts`](../src/lib/functions/comments.functions.ts), [`tags.functions.ts`](../src/lib/functions/tags.functions.ts), [`files.functions.ts`](../src/lib/functions/files.functions.ts) |

**Screens:** overview, issues list, issue detail. **Redo:** wrap views and editor; do not Figma-regenerate TipTap/Gantt/board.

### Documents

Workspace-scoped notes; many-to-many with issues; shared tags.

| Piece | File |
|-------|------|
| List | [`DocumentList.tsx`](../src/features/documents/components/DocumentList.tsx), [`document-column.tsx`](../src/features/documents/components/document-column.tsx), [`sort-documents.ts`](../src/features/documents/sort-documents.ts) |
| Detail | [`DocumentDetailForm.tsx`](../src/features/documents/components/DocumentDetailForm.tsx) |
| Tags | [`DocumentTags.tsx`](../src/features/documents/components/DocumentTags.tsx) |
| Linked issues | [`DocumentLinkedIssues.tsx`](../src/features/documents/components/DocumentLinkedIssues.tsx) |
| Server | [`documents.functions.ts`](../src/lib/functions/documents.functions.ts) |

Detail reuses [`IssueEditor`](../src/features/issues/components/IssueEditor.tsx). **Screens:** documents list, document detail.

### Settings

Roles: `MEMBER` < `ADMIN` < `OWNER` — [`src/lib/authz/roles.ts`](../src/lib/authz/roles.ts). Members/invites: ADMIN+. Delete workspace: OWNER. Hide workspace existence from non-members (`NOT_FOUND`).

| Piece | File |
|-------|------|
| General | [`WorkspaceGeneralForm.tsx`](../src/features/settings/components/WorkspaceGeneralForm.tsx) |
| Members | [`MembersPanel.tsx`](../src/features/settings/components/MembersPanel.tsx), [`member-columns.tsx`](../src/features/settings/components/member-columns.tsx) |
| Danger | [`DeleteWorkspaceCard.tsx`](../src/features/settings/components/DeleteWorkspaceCard.tsx) |
| Invite accept | [`AcceptInviteCard.tsx`](../src/features/settings/components/AcceptInviteCard.tsx) |
| Server | [`members.functions.ts`](../src/lib/functions/members.functions.ts) |

**Screens:** settings, invite.

### History

Change log on issue and document detail.

| Piece | File |
|-------|------|
| UI | [`ChangeHistory.tsx`](../src/features/history/components/ChangeHistory.tsx) |
| Format | [`format-history.ts`](../src/features/history/format-history.ts) |
| Queries | [`src/features/history/queries.ts`](../src/features/history/queries.ts) |
| Server | [`history.functions.ts`](../src/lib/functions/history.functions.ts) |

### Account

API keys for MCP.

| Piece | File |
|-------|------|
| Panel | [`ApiKeysPanel.tsx`](../src/features/account/components/ApiKeysPanel.tsx) |
| Schema | [`src/features/account/schema.ts`](../src/features/account/schema.ts) |
| MCP auth | [`src/mcp/auth.ts`](../src/mcp/auth.ts) |

### Auth (session)

better-auth; session via `getSession` / `getAuthSession`. Client: [`src/lib/auth-client.ts`](../src/lib/auth-client.ts). **Screens:** sign-in, sign-up, landing navbar.

---

## 5. Component registry — primitives (`src/components/ui`)

Do not add a parallel primitive. Prefer `shadcn@latest add` then catalog the result.

| ID | Import | Variants / API | Used on | Status |
|----|--------|----------------|---------|--------|
| button | [`button.tsx`](../src/components/ui/button.tsx) | `variant`: default, destructive, outline, secondary, ghost, link. `size`: default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg. `asChild` | Almost every page | keep |
| badge | [`badge.tsx`](../src/components/ui/badge.tsx) | default, secondary, destructive, outline, ghost, link | Sidebar, issue/doc tags | keep |
| input | [`input.tsx`](../src/components/ui/input.tsx) | native input + `cn` | Forms, search | keep |
| textarea | [`textarea.tsx`](../src/components/ui/textarea.tsx) | | Detail forms, comments | keep |
| label | [`label.tsx`](../src/components/ui/label.tsx) | | Via Field | keep |
| field | [`field.tsx`](../src/components/ui/field.tsx) | Field, FieldLabel, FieldError, FieldDescription, FieldGroup, FieldSet, FieldLegend, FieldSeparator, FieldContent, FieldTitle | Auth, settings, detail, members, API keys | keep |
| input-group | [`input-group.tsx`](../src/components/ui/input-group.tsx) | InputGroup, Addon, Button, Text, Input, Textarea | Sign-in, workspace list search | keep |
| select | [`select.tsx`](../src/components/ui/select.tsx) | Select, Trigger, Content, Item, Value, … | Issue fields, members, list filters | keep |
| checkbox | [`checkbox.tsx`](../src/components/ui/checkbox.tsx) | | *none yet* | unused |
| switch | [`switch.tsx`](../src/components/ui/switch.tsx) | | Issue filters | keep |
| slider | [`slider.tsx`](../src/components/ui/slider.tsx) | | *none* | unused |
| separator | [`separator.tsx`](../src/components/ui/separator.tsx) | | Page headers | keep |
| card | [`card.tsx`](../src/components/ui/card.tsx) | Card, Header, Title, Description, Content, Footer, Action | Auth, create workspace, invite, API keys | keep |
| tabs | [`tabs.tsx`](../src/components/ui/tabs.tsx) | TabsList `variant`: default, line | Issue views, settings | keep |
| table | [`table.tsx`](../src/components/ui/table.tsx) | Table, Header, Body, Row, Head, Cell, Caption | Via DataTable | keep |
| chart | [`chart.tsx`](../src/components/ui/chart.tsx) | ChartContainer, Tooltip, Legend, Style | Issue chart panel | keep |
| data-table | [`data-table.tsx`](../src/components/ui/data-table.tsx) | `table`, `emptyMessage`; sortable columns wrap headers in [`ListSortHeader`](../src/components/ListSortHeader.tsx) | Workspaces, issues list, documents, members | keep |
| dropdown-menu | [`dropdown-menu.tsx`](../src/components/ui/dropdown-menu.tsx) | | UserMenu, detail overflow, columns | keep |
| popover | [`popover.tsx`](../src/components/ui/popover.tsx) | | Sidebar switcher, filters, tags, links, columns | keep |
| tooltip | [`tooltip.tsx`](../src/components/ui/tooltip.tsx) | | Editor table toolbar; Sidebar internals | keep |
| dialog | [`dialog.tsx`](../src/components/ui/dialog.tsx) | Dialog, Content, Header, Footer, … | Save / rename issue views | keep |
| alert-dialog | [`alert-dialog.tsx`](../src/components/ui/alert-dialog.tsx) | **Destructive confirm only** | Issue/doc delete, comments, members, API keys, workspace delete | keep |
| sheet | [`sheet.tsx`](../src/components/ui/sheet.tsx) | | Sidebar mobile only | keep |
| breadcrumb | [`breadcrumb.tsx`](../src/components/ui/breadcrumb.tsx) | | Issue + document detail | keep |
| avatar | [`avatar.tsx`](../src/components/ui/avatar.tsx) | no size prop — use classes | UserMenu, comments | keep |
| skeleton | [`skeleton.tsx`](../src/components/ui/skeleton.tsx) | | Sidebar | keep |
| sidebar | [`sidebar.tsx`](../src/components/ui/sidebar.tsx) | Provider, Inset, Menu*, collapsible icon | Workspace layout + AppSidebar | keep |
| sonner (wrapper) | [`sonner.tsx`](../src/components/ui/sonner.tsx) | Themed Toaster | *root uses `sonner` directly* | unused |

---

## 6. Component registry — app chrome

| ID | File | Role | Screens | Status |
|----|------|------|---------|--------|
| logo | [`Logo.tsx`](../src/components/Logo.tsx) | Wordmark | Landing, sign-in, sign-up | wrap |
| landing-navbar | [`LandingNavbar.tsx`](../src/components/LandingNavbar.tsx) | Public header | `/` | wrap |
| app-sidebar | [`AppSidebar.tsx`](../src/components/AppSidebar.tsx) | Nav: overview, issues, saved views, documents, settings; workspace switch | `/app/$code/*` | wrap |
| list-sort-header | [`ListSortHeader.tsx`](../src/components/ListSortHeader.tsx) | Ghost button + chevron for active `asc`/`desc` | Issue/document/workspace list headers | wrap |
| list-sort-popover | [`ListSortPopover.tsx`](../src/components/ListSortPopover.tsx) | Filters-style Sort trigger, field/direction choices, reset chip | Issue/document/workspace list toolbars | wrap |
| user-menu | [`UserMenu.tsx`](../src/components/UserMenu.tsx) | Account, API keys, sign out | `/app`, `/app/account`, sidebar footer | wrap |
| sign-in-form | [`SignInForm.tsx`](../src/components/SignInForm.tsx) | Email/password | `/sign-in` | wrap |
| sign-up-form | [`SignUpForm.tsx`](../src/components/SignUpForm.tsx) | Registration | `/sign-up` | wrap |
| page-loading | [`PageLoading.tsx`](../src/components/PageLoading.tsx) | Route pending | Most `/app` routes | keep |
| page-error | [`PageError.tsx`](../src/components/PageError.tsx) | Route error | Same | keep |
| page-not-found | [`PageNotFound.tsx`](../src/components/PageNotFound.tsx) | 404 / no access | Root, workspace, issue, document | keep |

---

## 7. Component registry — feature UI (wrap, not regenerate)

Grouped by [features](#4-features). Treat as product surfaces: Query + server functions stay; visual chrome can change.

**Issues:** IssueList, IssueViewControls, IssueSaveViewDialog, IssueViewTabs, IssueFiltersPopover, ListSortPopover, IssueChartPanel, IssueTableView, IssueBoardView, IssueGanttView, IssueDetailForm, IssueEditor, TableToolbar, SlashCommandList, MermaidNodeView, IssueBadges, IssueTags, IssueTagBadge, IssueListTags, IssueComments, IssueLinkedDocuments.

**Documents:** DocumentList, DocumentDetailForm, DocumentTags, DocumentLinkedIssues. URL `sort` + `dir` via ListSortPopover; title and last-edited headers toggle the same state.

**Workspaces:** WorkspaceList, CreateWorkspaceForm. Name-only sort; ListSortPopover A-Z/Z-A stays in sync with the Name header.

**Settings:** WorkspaceGeneralForm, MembersPanel, DeleteWorkspaceCard, AcceptInviteCard.

**History:** ChangeHistory.

**Account:** ApiKeysPanel.

---

## 8. Agent rules

1. Check this catalog before new UI. If nothing matches, add a primitive (shadcn) or a feature component **and** a row here.
2. Map Figma to catalog names. Do not keep MCP/Tailwind one-offs for Button, Input, Card, Dialog, Table.
3. `Button asChild` + `Link` with `to` / `params` / `search` — never string-interpolate routes.
4. Destructive confirm → `AlertDialog`, not `Dialog`.
5. Form fields → `Field` + `FieldLabel` + `aria-invalid` from form meta. Do not use `&&` for counts that can be `0`.
6. Tables → `useAppTable` / `createAppColumnHelper` + `DataTable`.
7. TipTap, Mermaid, Gantt: client-only / lazy (`lazyImport`); do not SSR-mount.
8. Do not invent REST `/api/*` for UI data. Use existing `createServerFn` + Query options.
9. Tokens: `bg-background`, `text-muted-foreground`, `border-border`, `font-heading`, `font-mono`. Avoid new hex except workspace/tag colors already in data.
10. Unused primitives (checkbox, slider, ui/sonner): use them if they fit before adding another package.
