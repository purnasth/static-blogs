---
name: d1
description: Work with the engagement database — views and reactions stored in Cloudflare D1 and served by worker/index.ts. Use when the user asks about view counts, reactions, the stats dashboard's numbers, wants to query or snapshot the D1 data, or when engagement is behaving oddly locally or in production.
---

# Engagement / D1

`DEVELOPING.md` §12 is the full account, including the privacy design. Read it
before changing anything about how visitors are identified.

## The two worlds — check which one you're in first

- **Local (`pnpm write`)** — `src/lib/engagement.dev.ts`, an **in-memory**
  stand-in. Counts reset when the dev server restarts. This is not a bug, and
  local numbers mean nothing.
- **Production** — `worker/index.ts` against D1.

Shapes shared by both live in `src/lib/engagement.ts`. Change a reaction kind
or a payload shape there and both sides move together; change it in one place
only and the deployed site desyncs from local.

## Looking at the real data

```bash
pnpm db:pull   # exports remote D1 → .local/engagement.db (SQLite)
```

Then open `.local/engagement.db` in DBeaver with the SQLite driver, or query it
directly — `sqlite3` is on this machine and `wrangler` is a devDependency, so
both work without a global install.

```bash
sqlite3 .local/engagement.db "SELECT slug, views FROM post_views ORDER BY views DESC;"
sqlite3 .local/engagement.db "SELECT slug, kind, COUNT(*) FROM reactions GROUP BY slug, kind;"
```

It is a snapshot, not a live connection. Re-run `pnpm db:pull` for fresh
numbers. To hit production directly, add `--remote`:

```bash
npx wrangler d1 execute blog-engagement --remote --command "SELECT COUNT(*) FROM post_views;"
```

## The schema, and why it's shaped that way

`worker/schema.sql`, every statement idempotent so re-running is safe:

- `post_views` — running total per slug. An aggregate rather than `COUNT(*)`
  over the dedupe table, so reads stay O(1) as traffic grows.
- `post_view_visitors` — dedupe. `visitor` is a salted hash of IP + user-agent +
  slug that **rotates daily**. No IP is ever stored, and yesterday's rows can
  never match today's request, so the table is safe to truncate.
- `reactions` — one row per (slug, visitor, kind). That primary key is what
  makes reactions idempotent: hammering the button rewrites a row instead of
  counting. `visitor` here is the browser-held id, not the daily hash, so a
  visitor's own reactions survive midnight.
- `rate_limit` — per-IP-per-day write budget, expiring by the same rotation.

The daily cron in `wrangler.jsonc` (`0 4 * * *`) prunes the rotating tables.
04:00 UTC is deliberately clear of the midnight rotation they key on.

Apply a schema change once, by hand:

```bash
npx wrangler d1 execute blog-engagement --remote --file worker/schema.sql
```

## Careful with

- **Never store an IP.** The daily-rotating salted hash is the whole privacy
  argument for having no cookie banner. Don't "simplify" it into something
  stable across days.
- `src/lib/engagement-snapshot.ts` bakes counts into the HTML at build time, so
  a page shows a number before its fetch lands. A stale-looking count on a
  fresh deploy is that snapshot, not a broken API.
- The stats dashboard (`src/components/admin/StatsDashboard.tsx`, DEVELOPING
  §13) reads through the same API. Charts are hand-built — no chart library —
  and `charts.tsx` holds a validated series palette. Use it rather than picking
  colours.
