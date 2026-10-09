# Bookmark Manager

A full-stack bookmark manager: save, tag, search and revisit your favorite links. Built with React + TypeScript + Vite + Tailwind CSS on the client, and Express + TypeScript + Prisma + PostgreSQL on the server.

## Features

- **Authentication** — register / login with JWT (bcrypt-style scrypt password hashing), protected routes on both API and UI.
- **Bookmarks** — create, read, update, delete, duplicate-URL detection (409), pin / unpin, archive / restore, visit tracking (`viewCount`, `lastVisitedAt`).
- **Tags** — many-to-many tags with colors, create/rename/recolor/delete, filter bookmarks by tag with **ANY / ALL** modes.
- **Search & sort** — debounced search (300 ms) across title, URL and description; sorts: newest, oldest, recently visited, most visited, title A→Z / Z→A; pinned items float to the top; pagination.
- **Metadata fetching** — server-side page title / description / favicon scraping with SSRF protection (private IP & hostname blocklist, redirect limits, timeout, size cap).
- **Import / export** — bulk import bookmarks (dedupes existing URLs) and export the whole library as JSON.
- **Stats** — counts for all / pinned / archived bookmarks (shown in the sidebar).
- **UI** — light & dark theme (persisted, no flash on load), responsive layout with mobile sidebar, grid/list view, empty/loading/error states, toasts, accessible dialogs & menus.
- **Production ready** — the Express server serves the built client (`SPA` fallback), Helmet CSP, CORS, rate limiting (auth / API / metadata), structured error envelope.

## Tech stack

| Layer    | Stack |
|----------|-------|
| Client   | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, lucide-react |
| Server   | Express 5, TypeScript, Zod validation, Helmet, express-rate-limit, jsonwebtoken |
| Database | PostgreSQL (Neon or local), Prisma 7 (`prisma-client` generator) |
| Tooling  | npm workspaces, tsx, esbuild, Vitest, ESLint (flat config), concurrently |

## Requirements

- Node.js 20+ (tested on Node 22)
- npm 10+
- A PostgreSQL database — [Neon](https://neon.tech) (free tier) or a local PostgreSQL instance

## Getting started

```bash
# 1. Install dependencies (also generates the Prisma client via postinstall)
npm install

# 2. Configure the environment
cp server/.env.example server/.env
#    then edit server/.env:
#    - DATABASE_URL  -> your Neon / local PostgreSQL connection string
#    - JWT_SECRET    -> a long random string

# 3. Create the schema and seed demo data
npm run db:migrate
npm run db:seed

# 4. Start the app (API on :4000, Vite dev server on :5173)
npm run dev
```

Open **http://localhost:5173** and sign in with the demo account:

```
email:    demo@example.com
password: password123
```

The seed creates 15 bookmarks (2 archived) and 6 tags so every view has content.

## Production build

```bash
npm run build   # builds server (esbuild bundle) + client (Vite)
npm start       # serves API and the built client on http://localhost:4000
```

Make sure `NODE_ENV=production` and a strong `JWT_SECRET` are set in `server/.env`.

## Deploy to Vercel + Neon

The repo is pre-configured for Vercel (`vercel.json` + `api/[...path].ts`): one project serves
the static client (`client/dist`, SPA rewrite) **and** the Express API as a serverless function
under `/api/*`.

1. **Push the repo to GitHub.**
2. **Create a Neon project** and copy the **Pooled** connection string (`...?sslmode=require`).
3. **Vercel → Add New Project → Import the repo.** Root = repository root; `vercel.json` already
   sets:
   - `installCommand`: `npm install` (postinstall generates the Prisma client)
   - `buildCommand`: `npm run db:deploy && npm run build` (applies migrations, then builds)
   - `outputDirectory`: `client/dist`
   - SPA rewrite for every non-`/api` path
4. **Environment variables** (Production *and* Preview):

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Neon pooled connection string |
   | `JWT_SECRET` | long random string (≥ 16 chars) |
   | `CLIENT_ORIGIN` | `https://<your-app>.vercel.app` |
   | `NODE_ENV` | `production` (Vercel sets this automatically) |
   | `VITE_API_URL` | *optional* — only if the API is hosted on a different origin |

5. **Deploy.** Migrations run on every build; the function entry is `api/[...path].ts`
   (`createApp()` from the server, no `listen` needed).
6. *Optional:* load demo data once against production: `DATABASE_URL=... npm run db:seed`.

**Splitting the API later:** deploy the API to a second Vercel project (same `api/` entry),
then set `VITE_API_URL=https://<api-app>.vercel.app` in the client project (build-time) and
`CLIENT_ORIGIN` on the API to the client URL. Leaving `VITE_API_URL` empty keeps relative
`/api/*` calls (single-domain setup, also used by the local Vite proxy in dev).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run API (`tsx watch`) and Vite together |
| `npm run build` | Build server bundle + client bundle |
| `npm start` | Run the built server (`server/dist/index.js`) |
| `npm run typecheck` | `tsc --noEmit` for server and client |
| `npm run lint` | ESLint across the workspace |
| `npm run test` | Vitest unit tests (URL normalization, metadata parsing) |
| `npm run db:migrate` | Create/apply Prisma migrations (dev) |
| `npm run db:seed` | Seed demo user, bookmarks and tags |
| `npm run db:generate` | Regenerate the Prisma client (also runs on `npm install`) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:deploy` / `npm run db:push` | Production migration apply / schema push |

## Environment variables (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string (`?schema=public`, add `?sslmode=require` for Neon) |
| `PORT` | `4000` | API port |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin(s), comma separated |
| `JWT_SECRET` | dev fallback | Token signing secret (min 16 chars) |
| `JWT_EXPIRES_IN` | `7d` | Access token lifetime |

## API overview

All responses use the envelope `{ "success": true, "data": ... }` or
`{ "success": false, "error": { "code", "message", "details?" } }`.
Authenticated endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account, returns token |
| POST | `/api/auth/login` | Sign in, returns token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/bookmarks` | List — `search`, `tags`, `tagMode=any\|all`, `sortBy`, `archived`, `pinned`, `pinFirst`, `page`, `limit` |
| POST | `/api/bookmarks` | Create (409 on duplicate URL) |
| GET/PATCH/DELETE | `/api/bookmarks/:id` | Read / update / delete |
| POST | `/api/bookmarks/:id/{pin,unpin,archive,restore,visit}` | Flag actions & visit tracking |
| GET | `/api/bookmarks/stats` | `{ all, pinned, archived }` |
| GET | `/api/bookmarks/export` | Full library as JSON |
| POST | `/api/bookmarks/import` | Bulk import, returns `{ imported, skipped, total }` |
| POST | `/api/bookmarks/metadata` | Fetch page metadata (SSRF-safe, rate limited) |
| GET/POST | `/api/tags` | List / create tags |
| PATCH/DELETE | `/api/tags/:id` | Rename/recolor / delete |
| GET | `/api/health` | Health check |

## Project structure

```
├── client/                 # React app
│   ├── public/             # theme-init.js (no-FOUC theme), favicon
│   └── src/
│       ├── components/     # ui primitives, bookmarks, layout
│       ├── context/        # Auth, Theme, Toast providers
│       ├── hooks/          # useBookmarks, useTags, useDebounce, ...
│       ├── pages/          # Bookmarks, Tags, Settings, Login, Register
│       └── services/       # typed API calls
└── server/                 # Express API
    ├── prisma/             # schema, migrations, seed.ts
    └── src/
        ├── config/         # env validation (Zod)
        ├── controllers/    # request handlers
        ├── lib/            # prisma, jwt, password, url + SSRF guards
        ├── middleware/     # auth, validation, rate limits, errors
        ├── routes/         # auth, bookmarks, tags
        ├── services/       # business logic (bookmarks, tags, auth, import, metadata)
        └── validators/     # Zod schemas shared by routes
```

## Testing & quality

```bash
npm run lint        # ESLint (flat config, react-hooks + typescript-eslint)
npm run typecheck   # strict TS for both workspaces
npm run test        # Vitest: URL normalization/SSRF helpers, metadata parsing (23 tests)
```

The API surface (auth, CRUD, search/sort/filter, pagination, pin/archive/visit, import/export, tag lifecycle, validation and SSRF error paths) was verified end-to-end against a real PostgreSQL database.

## Security notes

- Passwords hashed with Node's `scrypt` (per-user salt).
- JWT bearer tokens with configurable expiry; 401 responses clear the client session.
- Metadata fetch blocks private/loopback/link-local addresses, internal hostnames, non-HTTP(S) schemes, follows at most 3 redirects with a 5 s timeout and 512 KB body cap.
- Rate limits: 30 auth attempts / 15 min, 600 API requests / 15 min, 20 metadata fetches / min per IP.
- Helmet CSP, strict CORS origins, 1 MB JSON body limit.
