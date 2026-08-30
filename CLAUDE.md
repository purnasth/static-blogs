@AGENTS.md

# purna-blogs

A personal blog that ships as a **100% static export**, plus a **writing desk
that only exists on localhost**. The single dynamic piece is engagement (views
and four reactions), served by a Cloudflare Worker on `/api/*` backed by D1.

Long-form docs already exist and are kept current — prefer reading them over
re-deriving anything:

- `README.md` — what the project is, the page list, deploy overview.
- `DEVELOPING.md` — the real reference. §5 file map, §9 gotchas, §10
  troubleshooting, §11 frontmatter, §12 engagement/D1, §13 stats dashboard.
- `SETUP.md` — first-machine setup, written for a non-developer.

## Commands

```bash
pnpm write     # dev server (alias of `pnpm dev`) — the ONLY way to reach /admin
pnpm build     # static export to out/ ; uses tsconfig.build.json
pnpm lint      # eslint
pnpm db:pull   # snapshot remote D1 to .local/engagement.db for DBeaver
```

pnpm only. If a `package-lock.json` appears, delete it — two lockfiles drift.

## The one architectural rule

The admin UI and its API routes live in files suffixed `.dev.tsx` / `.dev.ts`.
`next.config.ts` puts those extensions in `pageExtensions` **only in
development**, so the writing tools physically cannot reach the deployed
bundle. Consequences:

- Any new admin page or writing endpoint **must** carry the `.dev` suffix, or
  it ends up on the public internet. If a new admin page 404s locally, the
  missing suffix is almost always why.
- `src/lib/engagement.dev.ts` is the in-memory stand-in for the Worker under
  `next dev`; `worker/index.ts` is the real thing in production. Shapes shared
  by both live in `src/lib/engagement.ts` — change them together.
- Two tsconfigs on purpose: edit `tsconfig.json`; `tsconfig.build.json`
  inherits it and only exists to ignore the dev-generated `.next/dev` route
  types. Don't merge them.

## Things that will bite

- `trailingSlash: true` — every internal link and `fetch("/api/...")` needs the
  trailing `/`, or it costs a redirect.
- `images.unoptimized` is set (static export has no image server). Images are
  served at full size from `public/images/` and live in git.
- YAML turns an unquoted `date: 2026-08-04` into a Date and a quoted one into a
  string. `toIsoDate()` in `src/lib/posts.ts` handles both — leave it alone.
- `wrangler.jsonc` must stay committed. Without it, Cloudflare auto-detects
  Next.js and tries to deploy a server app, which fails (DEVELOPING.md §7).

## Where to start editing

| Task | File |
| --- | --- |
| Site title, description, nav, domain | `src/lib/site.ts` |
| Colours, article typography | `src/app/globals.css` |
| Post parsing / frontmatter | `src/lib/posts.ts`, `src/lib/types.ts` |
| Markdown pipeline | `src/lib/markdown.ts` |
| Reading/writing posts on disk | `src/lib/storage/local.ts` (behind the `PostStore` interface in `storage/index.ts`) |
| Engagement API | `worker/index.ts` + `worker/schema.sql` |

Posts are `content/posts/<slug>.md`; `draft: true` keeps a post local-only.

## Skills

Project skills live in `.claude/skills/<name>/SKILL.md`.

| Command | What it does |
| --- | --- |
| `/ship-check` | Pre-publish gate — lint, build, draft flags, frontmatter, image paths and weight, trailing slashes, `wrangler.jsonc`. This repo has no CI; this is it. |
| `/ui` | Load before writing any component. Semantic tone tokens, the `ui/` primitives, const-objects-not-enum. |
| `/draft` | Start a post with valid frontmatter, or line-edit an existing one in the author's voice. |
| `/grill-me` | Interrogates you about a draft, a diff, or an idea — one hard question at a time, no rewriting. |
| `/deploy` | Cloudflare deploy path and failure triage. |
| `/d1` | Engagement database — snapshots, queries, schema, the privacy constraints. |
