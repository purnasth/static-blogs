# blogs-static

A personal blog that is **100% static in production** but has a **real writing
interface** you run on your own machine. No CMS to log into, no database, no
server to keep patched.

---

**New here? Read [DEVELOPING.md](./DEVELOPING.md)** — running it, how it works,
changing it, deploying it, and what to do when something breaks.

---

## Running it

```bash
pnpm install      # first time only
pnpm write        # same as pnpm dev
```

- Blog: **http://localhost:3000**
- Writing desk: **http://localhost:3000/admin**

`Ctrl+C` in that terminal stops it. If 3000 is already taken, Next moves to the
next free port and prints the one it used — read the terminal.

## The pages

**Public — deployed:**

| Route | Purpose |
| --- | --- |
| `/` | Home: every published post, newest first |
| `/posts/<slug>/` | A single post |
| `/tags/` | All tags, with counts |
| `/tags/<tag>/` | Posts carrying one tag |
| `/about/` | Renders `content/about.md` |
| `/rss.xml` | Feed for readers |
| `/sitemap.xml` | For search engines |

**Writing desk — local only, never deployed:**

| Route | Purpose |
| --- | --- |
| `/admin/` | Post list + the Publish button |
| `/admin/edit/new/` | Write a new post |
| `/admin/edit/<slug>/` | Edit or delete an existing one |

Full detail, including the API endpoints the editor uses, is in
[DEVELOPING.md §2](./DEVELOPING.md).

## Writing a post

**Step by step, first time?** Follow the route-by-route walkthrough in
[DEVELOPING.md §3](./DEVELOPING.md) — it goes from an empty editor to a live
post, naming the address you're at for each step. The short version:

Open **http://localhost:3000/admin**.

- **New post** → title, date, tags, summary, cover, draft toggle, markdown body.
- **Drag an image** into the editor (or paste, or use the *image* button). It's
  saved to `public/images/` and the markdown is inserted at your cursor.
- **⌘S / Ctrl+S** saves. The post is written to `content/posts/<slug>.md`.
- **Preview** toggles a rendered view; *preview ↗* on the list opens the real page.
- Posts marked **draft** are visible locally and excluded from the built site.

When you're happy, go back to `/admin` and hit **Commit & push**. That commits
your posts and images and pushes them; the host rebuilds and the post is live.

## How the admin stays out of the deployed site

The admin lives in files named `page.dev.tsx` / `route.dev.ts`. `next.config.ts`
only adds `.dev.tsx` / `.dev.ts` to `pageExtensions` in development:

```ts
output: isDev ? undefined : "export",
pageExtensions: isDev ? ["dev.tsx", "dev.ts", "tsx", "ts"] : ["tsx", "ts"],
```

So in a production build those files aren't routes at all. `pnpm build`
lists the routes it emits — `/admin` and `/api/*` are not among them, and
`out/` contains no trace of them. The deployed site is HTML, CSS and a little
JavaScript, with nothing to break into.

## Layout

```
content/
  posts/*.md          your posts (frontmatter + markdown)
  about.md            the About page
public/images/        images added from the editor
src/lib/
  posts.ts            reads posts at build time
  markdown.ts         markdown -> HTML (GFM, heading anchors, code highlight)
  site.ts             site title, description, nav, URL   <- edit this first
  storage/            write path used by the admin
    index.ts          PostStore interface + getStore()
    local.ts          filesystem + git implementation
src/app/
  page.tsx            post list
  posts/[slug]/       post page
  tags/               tag index + per-tag pages
  rss.xml/            RSS feed
  admin/*.dev.tsx     writing desk (dev only)
  api/**/*.dev.ts     save / upload / publish (dev only)
```

## Before you deploy

1. Edit `src/lib/site.ts` — title, description, author, and **`url`** (the real
   domain; it's used for RSS, sitemap and social previews).
2. Replace `src/app/favicon.ico`.
3. Edit `content/about.md`.

## Deploying to Cloudflare

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** →
   **Connect to Git**, pick the repo.
3. Build settings:
   - Build command: `pnpm build`
   - Deploy command: `npx wrangler deploy`
4. Deploy. Every push to `main` rebuilds automatically.

`wrangler.jsonc` is what makes this work: it declares an **assets-only Worker**
serving `out/`, with no server-side code. Keep it committed — without it,
`wrangler deploy` guesses that a Next.js repo must be server-rendered and tries
to convert the project to OpenNext, which fails (see
[DEVELOPING.md §7](./DEVELOPING.md)). The Worker `name` in that file must match
the project name in the dashboard.

`public/_headers` sets security and caching headers; Cloudflare applies it.

## Adding remote publishing later ("Shape B")

Today the admin only runs locally, so you can only post from this machine. To
post from anywhere, the admin needs to reach the repo without a local
filesystem — that's the only thing that changes:

1. Add `src/lib/storage/github.ts` implementing the same `PostStore` interface,
   committing files via the GitHub Contents API with a fine-grained token.
2. Branch in `getStore()` on an env var (e.g. `BLOG_STORE=github`).
3. Deploy the admin **separately** (a small Worker/Next app behind auth) — never
   fold it into this static site.

The admin UI, validation and API routes stay as they are; only the storage
implementation swaps.

## Known limitations

- `output: "export"` disables Next.js image optimisation, so images are served
  at their original size (`images.unoptimized` is set). For a photo-heavy blog,
  either resize before uploading, add a build-time `sharp` step, or put images
  behind Cloudflare Images.
- Images are committed to git. That's fine for hundreds of photos; if the repo
  gets large, move `public/images` to R2 or Cloudflare Images.
- No comments or search yet — both are addable to a static site (Giscus for
  comments, a prebuilt index for search).
