# CalArts Collaborate

Cross-school Q&A forum for the CalArts community (`calarts.edu` and its subdomains, including `alum.calarts.edu`). Built with Next.js App Router, shadcn/ui, and Supabase (Auth, Postgres, Storage, Realtime).

## Features

- Stack Overflow–style questions, answers, and comments (no votes / karma)
- Fixed CalArts school filters (Art, Critical Studies, Dance, Film/Video, Music, Theater)
- File attachments on questions and answers (images, audio, zip · ≤10 MB · max 5)
- Profile settings, avatars, and post/comment history
- Live home feed and live question threads via Supabase Realtime

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env.local` and set your Supabase project values:

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

### 3. Database

Apply the migration in [`supabase/migrations/20260719095549_forum_schema.sql`](supabase/migrations/20260719095549_forum_schema.sql) to your Supabase project (SQL editor, CLI `supabase db push`, or MCP).

This creates tables, RLS policies, storage buckets (`avatars`, `attachments`), realtime publication, and seeds CalArts schools.

### 4. Auth configuration (Supabase Dashboard)

1. **Authentication → Providers → Email** — enable email/password.
2. Restrict signups to `calarts.edu` and its subdomains (Auth email allowlist / hook if available, plus app-side validation).
3. **URL configuration** — add site URL and redirect: `http://localhost:3000/auth/callback` (and production URL).
4. Confirm email templates point at your callback URL.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (validation helpers) |

## Deploy (Vercel)

1. Push the repo and import into Vercel.
2. Set the same `NEXT_PUBLIC_SUPABASE_*` env vars.
3. Add the production URL to Supabase Auth redirect allowlist.
4. Deploy.

## Smoke checklist

1. Register with a `calarts.edu` or subdomain address and confirm email.
2. Update settings (avatar + schools).
3. Ask a question with an attachment.
4. Answer with an attachment; add comments.
5. Confirm profile history lists posts.
6. Open home + thread in two tabs and confirm live updates.

## Docs

- Design: [`docs/superpowers/specs/2026-07-19-calarts-collaborate-forum-design.md`](docs/superpowers/specs/2026-07-19-calarts-collaborate-forum-design.md)
- Plan: [`docs/superpowers/plans/2026-07-19-calarts-collaborate-forum-implementation.md`](docs/superpowers/plans/2026-07-19-calarts-collaborate-forum-implementation.md)
