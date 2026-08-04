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

- Blog: **http://localhost:5050**
- Writing desk: **http://localhost:5050/admin**

`Ctrl+C` in that terminal stops it.

> **Note:** the dev server starts at **5050**, not Next's usual 3000 — 3000 was
> being taken by other things. If 5050 is busy it automatically moves to 5051,
> 5052, … and prints which port it used, so it never fails to start. Scan from
> somewhere else with `PORT=7000 pnpm write`. This is temporary; see
> [TODO.md](./TODO.md) for how to put it back to 3000.

## Writing a post

Open **http://localhost:5050/admin**.

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

## Deploying to Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, pick the repo.
3. Build settings:
   - Framework preset: **None**
   - Build command: `pnpm build`
   - Build output directory: `out`
4. Deploy. Every push to `main` rebuilds automatically.

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
