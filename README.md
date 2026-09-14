# task-v0

A multi-tenant workspace for issues and documents. Built with TanStack Start on Cloudflare Workers, Postgres via Drizzle, and better-auth.

## What's implemented

- **Workspaces** — create, switch, and manage multi-tenant spaces with role-based access (`MEMBER` / `ADMIN` / `OWNER`)
- **Issues** — numbered per workspace with status, priority, tags, comments, start/end dates, and change history
  - **List**, **board** (drag-and-drop reorder), and **Gantt** views
  - Saved workspace views with filters, sort, layout, and board card fields
  - TipTap editor with slash commands, Mermaid diagrams, and image uploads
- **Documents** — workspace notes linked to issues, with tags and change history
- **Settings** — general workspace info, member invites, storage usage, and workspace deletion (owner only)
- **Auth** — email/password sign-up and sign-in, email verification, forgot/reset password (Resend)
- **Account** — email status, change password, API keys for MCP
- **MCP API** — HTTP endpoint at `/api/mcp` for programmatic access (issues, documents, tags, comments, history)
- **Quotas** — 5 workspaces per user, 20 members per workspace, 2 GB uploads per workspace (exempt via `QUOTA_EXEMPT_USER_IDS`)

UI inventory and route map: [`docs/ui-catalog.md`](docs/ui-catalog.md).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, TanStack Form + Table |
| Auth | [better-auth](https://www.better-auth.com/) |
| Database | [Neon](https://neon.tech) / Postgres + [Drizzle ORM](https://orm.drizzle.team/) |
| Storage | Cloudflare R2 (description images) |
| Email | [Resend](https://resend.com/) |
| Deploy | [Cloudflare Workers](https://workers.cloudflare.com/) via Wrangler |
| Lint/format | Biome |

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon/Postgres connection string |
| `BETTER_AUTH_SECRET` | Auth signing secret (`npx -y @better-auth/cli secret`) |
| `BETTER_AUTH_URL` | Public origin, e.g. `http://localhost:3000` |
| `QUOTA_EXEMPT_USER_IDS` | Optional comma-separated user IDs that skip workspace, member, and upload limits |
| `RESEND_API_KEY` | Optional. Sends verification and password-reset emails |
| `EMAIL_FROM` | Optional sender, e.g. `Task <noreply@yourdomain.com>` |

Apply schema, then start the app:

```bash
npm run db:migrate
npm run dev
```

The dev server runs on [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite + Wrangler local server on port 3000 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Biome lint |
| `npm run format` | Biome format |
| `npm run check` | Biome lint + format |
| `npm run build` | Production Worker build |
| `npm run preview` | Build and preview locally |
| `npm run deploy` | Build and `wrangler deploy` |
| `npm run generate-routes` | Regenerate TanStack Router route tree |
| `npm run db:generate` | Create a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:studio` | Open Drizzle Studio |

## MCP API

Create an API key on **Account** (`/app/account`), then connect an MCP client to:

```
https://<your-origin>/api/mcp
```

Authenticated requests use the API key as a Bearer token. Available tools include workspace listing, issue and document CRUD, tags, comments, and change history. See [`src/mcp/server.ts`](src/mcp/server.ts) for the full tool list.

## Deploy to Cloudflare Workers

1. Create a [Neon](https://neon.tech) database and run `npm run db:migrate` against it.
2. `npx wrangler login`
3. Enable R2 in the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/r2/overview), then create the bucket used for description images:

```bash
npx wrangler r2 bucket create task-v0-uploads
```

4. Set Worker secrets (do not put these in `wrangler.jsonc`):

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
```

`BETTER_AUTH_URL` must be the public origin, for example `https://task-v0.<account>.workers.dev`, with no trailing slash.

`EMAIL_FROM` should be a verified Resend sender, for example `Task <noreply@yourdomain.com>`. For Resend sandbox only, use `Task <onboarding@resend.dev>` (delivers to the Resend account email).

5. `npm run deploy`

Preview the production build locally with `npm run preview` after `npm run build`.

## Project layout

```
src/
  routes/          # TanStack Router file routes
  features/        # Domain UI (issues, documents, workspaces, settings, …)
  components/      # Shared UI and shadcn primitives
  lib/             # Server functions, data layer, auth, quotas
  db/              # Drizzle schema
  mcp/             # MCP server and auth
drizzle/           # SQL migrations
docs/ui-catalog.md # UI and route reference for agents and contributors
```

## License

[MIT](LICENSE)

## Git

Do not commit `.env.local`, `.dev.vars`, or Wrangler secret dumps. `.env.example` is the committed template.
