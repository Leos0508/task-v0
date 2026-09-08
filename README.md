# task-v0

Workspace issue tracker on TanStack Start, Drizzle, better-auth, and Cloudflare Workers.

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

Apply schema, then start the app:

```bash
npm run db:migrate
npm run dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite + Wrangler local server on port 3000 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | Biome lint + format |
| `npm run build` | Production Worker build |
| `npm run deploy` | Build and `wrangler deploy` |
| `npm run db:generate` | Create a Drizzle migration |
| `npm run db:migrate` | Apply migrations |

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
```

`BETTER_AUTH_URL` must be the public origin, for example `https://task-v0.<account>.workers.dev`, with no trailing slash.

5. `npm run deploy`

Preview the production build locally with `npm run preview` after `npm run build`.

## Git

Do not commit `.env.local`, `.dev.vars`, or Wrangler secret dumps. `.env.example` is the committed template.
