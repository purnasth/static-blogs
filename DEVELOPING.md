# Developer guide

Everything about how this blog is built, how to run it, how to change it, and
what to do when something breaks. If you just want to write a post, the top of
[README.md](./README.md) is enough.

---

## 1. Running it

### Prerequisites

- **Node.js 20.9 or newer** (built and tested on 22.16). Check with `node -v`.
- **pnpm 10** — this project uses pnpm, not npm. Check with `pnpm -v`. If you
  don't have it: `corepack enable && corepack prepare pnpm@10.11.0 --activate`,
  or `brew install pnpm`.
- **git** (the Publish button shells out to it).

`package.json` pins `packageManager: pnpm@10.11.0`, so Corepack and Cloudflare
both use the right version automatically. The lockfile is `pnpm-lock.yaml` —
commit it. There is no `package-lock.json`; don't let one reappear (that means
someone ran `npm install`, and the two lockfiles will drift).

### First time on a new machine

```bash
cd ~/Documents/blogs-static
pnpm install
pnpm write
```

Then open two tabs:

| URL | What it is |
| --- | --- |
| http://localhost:3000 | the blog, exactly as visitors will see it |
| http://localhost:3000/admin | the writing desk (only exists locally) |

### About the port

`pnpm write` runs plain `next dev`, so it uses Next's default **3000**. If that
port is taken, Next moves to the next free one and prints it.

To pick a different port:

```bash
PORT=7000 pnpm write
```

Not 5000 — on macOS that port belongs to ControlCenter (AirPlay Receiver), so
binding it fails.

Note that Next 16 allows only **one dev server per project directory**. Starting
a second one on a different port exits with "Another next dev server is already
running" and tells you the PID to kill. So `PORT=…` switches which port you use,
not how many servers you run.

Whatever port ends up being used, the terminal prints it — read the line that
says `Local: http://localhost:XXXX` and use that.

**To stop it:** press `Ctrl+C` in that terminal. If you lost the terminal:

```bash
pkill -f "next dev"; pkill -f "next-server"
```

Both patterns matter — `next dev` spawns a `next-server` child, and killing only
the parent leaves the port held. That is the usual cause of "Port 3000 is in use"
when you are sure nothing is running.

### The commands

| Command | What it does |
| --- | --- |
| `pnpm write` | Start the local server **with** the writing desk. Same as `pnpm dev`. |
| `pnpm dev` | Identical — alias kept because that's what every Next tutorial says. |
| `pnpm build` | Produce the deployable static site in `out/`. This is what Cloudflare runs. |
| `pnpm lint` | ESLint. Run it before pushing if you've changed code. |
| `pnpm start` | Not used here. This project deploys as static files, not a Node server. |
| `pnpm install --frozen-lockfile` | What CI/Cloudflare runs. Fails instead of silently updating the lockfile. |

`pnpm build` is worth running yourself once in a while — it's the only thing
that proves the site still compiles, and it prints the exact list of pages that
will be deployed.

---

## 2. Every page in the site

Three groups. The first ships to readers; the other two exist only while
`pnpm write` is running and are physically absent from the deployed site (§4).

### Public pages — these get deployed

| Route | What it is | Source file |
| --- | --- | --- |
| `/` | Home. Every published post, newest first, with date, reading time and summary. | `src/app/page.tsx` |
| `/posts/<slug>/` | One post: title, date, optional cover image, the article, its tags. One page is generated per `.md` file. | `src/app/posts/[slug]/page.tsx` |
| `/tags/` | Index of every tag with a count. | `src/app/tags/page.tsx` |
| `/tags/<tag>/` | Every post carrying that tag. One page per tag in use. | `src/app/tags/[tag]/page.tsx` |
| `/about/` | Renders `content/about.md`. Edit that file, not the page. | `src/app/about/page.tsx` |
| `/rss.xml` | RSS feed of published posts, full article text included, for feed readers. | `src/app/rss.xml/route.ts` |
| `/sitemap.xml` | Every URL on the site, for search engines. | `src/app/sitemap.ts` |
| *404* | Shown for any address that doesn't exist. | `src/app/not-found.tsx` |

Drafts appear in none of these once built — not the home page, not RSS, not the
sitemap.

### Writing-desk pages — local only, never deployed

| Route | What it's for |
| --- | --- |
| `/admin/` | The hub. Lists every post (drafts included) with a link to edit each one, a **New post** button, and the **Publish** panel showing your git branch, whether a remote is configured, and how many changes are waiting. |
| `/admin/edit/new/` | Blank editor. Creating a post. |
| `/admin/edit/<slug>/` | The same editor loaded with an existing post, plus a **Delete** button. |

### API endpoints — local only, never deployed

You never call these by hand; the editor does. Listed so you know what exists.

| Endpoint | Does |
| --- | --- |
| `POST /api/posts/` | Validates the fields and writes `content/posts/<slug>.md`. Handles renames. |
| `DELETE /api/posts/<slug>/` | Deletes that post's file. |
| `POST /api/images/` | Saves an uploaded image into `public/images/`, avoiding name collisions. |
| `POST /api/publish/` | `git add -A`, commit, push. |

---

## 3. From blank page to published — the route-by-route walkthrough

Follow this end to end the first time. Each step says which address you're at.

### Step 1 — start the server (terminal)

```bash
cd ~/Documents/blogs-static
pnpm write
```

Read the port it prints: `Local: http://localhost:3000`. Everywhere below,
`<port>` means that number. Leave this terminal running the whole time.

### Step 2 — open the hub → `http://localhost:<port>/admin`

You'll see your existing posts and the Publish panel. This is home base; you
come back here at the end.

### Step 3 — start a post → click **New post** → `/admin/edit/new/`

The blank editor.

### Step 4 — fill in the top box (same page)

- **Title** — as you type it, the **Slug** fills in automatically. The slug is
  the post's address: `A Walk in Pokhara` → `/posts/a-walk-in-pokhara/`. Change
  it only if you want a different URL.
- **Date** — defaults to today. Controls ordering on the home page.
- **Tags** — comma-separated. Each one becomes a `/tags/<tag>/` page.
- **Summary** — one line, shown under the title on `/` and in RSS.
- **Cover image path** — optional, e.g. `/images/lake.jpg`. Shown above the
  article. Fill it in after you've uploaded the image in step 6.
- **Draft** (top right) — leave **ticked** while you're working.

### Step 5 — write the body (same page)

Markdown in the large box:

```markdown
## A section heading

A paragraph. **Bold**, _italic_, and a [link](https://example.com).

- a bullet
- another

> a quotation
```

The toolbar buttons (B, i, H2, link, code, quote, list) insert these for you —
select text first, then click, to wrap what you selected.

### Step 6 — add photos (same page)

**Drag an image file straight into the text box**, or paste it, or click the
**image** button. It's copied into `public/images/` and the markdown line is
inserted where your cursor was. Several at once is fine.

### Step 7 — save → `⌘S`, or the **Save** button

The post is now a real file: `content/posts/<slug>.md`. The address bar changes
to `/admin/edit/<slug>/` and a **Delete** button appears. Save as often as you
like — nothing is public yet.

### Step 8 — check how it actually looks → `/posts/<slug>/`

Click **preview ↗** from `/admin/`, or type the address. This is the real page,
exactly as a reader will see it. **Preview** inside the editor is a quicker,
rougher approximation — trust `/posts/<slug>/`.

Leave the tab open: edit, `⌘S`, refresh.

### Step 9 — make it public → untick **Draft**, then `⌘S`

Until you do this, the post exists only on your machine.

### Step 10 — publish → back to `/admin/` → **Commit & push**

Type a short note in the box (optional) and click the button. It commits your
posts *and* their images together, then pushes.

- **Remote configured:** Cloudflare rebuilds and the post is live in about a
  minute, at `https://<your-domain>/posts/<slug>/`.
- **No remote yet:** it commits locally and tells you so. Nothing is lost, it
  just isn't online. §7 sets up the remote.

### Editing something you already published

`/admin/` → click its title → `/admin/edit/<slug>/` → change → `⌘S` →
**Commit & push**. Same loop, no step 3.

One caution: changing the **Slug** of a published post changes its URL, and the
old address will 404 for anyone who bookmarked or linked it. The editor stops
auto-updating the slug once a post exists, precisely so this doesn't happen by
accident.

### Deleting

Open the post in the editor and click **Delete**. It removes the file; publish
afterwards to remove it from the live site. Images stay in `public/images/` —
delete those by hand if nothing else uses them.

### Drafts, in one line

`draft: true` posts are visible on your local site so you can preview them
properly, and are stripped from the built site entirely — not in the HTML, not
in RSS, not in the sitemap. The switch is in `src/lib/posts.ts`:

```ts
const showDrafts = process.env.NODE_ENV === "development";
```

---

## 4. How it fits together

### Two completely separate paths

```
READ PATH (build time, ships to visitors)
  content/posts/*.md
    → src/lib/posts.ts        parse frontmatter, sort, drop drafts
    → src/lib/markdown.ts     markdown → HTML
    → src/app/**/page.tsx     React → static HTML in out/

WRITE PATH (your machine only, never deployed)
  /admin UI (src/components/admin/*)
    → /api/* route handlers (src/app/api/**/*.dev.ts)
    → src/lib/storage/local.ts    fs.writeFile + git
    → content/posts/*.md
```

The read path has no idea the write path exists. That's deliberate: it's why the
deployed site can't be written to.

### The dev-only trick

The admin pages and API routes are named `page.dev.tsx` and `route.dev.ts`.
`next.config.ts` decides whether those count as routes at all:

```ts
const isDev = process.env.NODE_ENV === "development";

output: isDev ? undefined : "export",
pageExtensions: isDev ? ["dev.tsx", "dev.ts", "tsx", "ts"] : ["tsx", "ts"],
```

In production `.dev.tsx` isn't a recognised page extension, so Next never sees
those files as routes. They aren't rendered, aren't bundled, aren't in `out/`.

**Verify it yourself any time:**

```bash
pnpm build                 # read the printed route list — no /admin, no /api
grep -rl "Writing desk" out/  # prints nothing
```

This is the security property of the whole design, so it's worth re-checking
after you add any admin feature.

### The storage interface

`src/lib/storage/index.ts` defines `PostStore` — list, get, save, remove,
saveImage, status, publish. `local.ts` implements it with the filesystem and
git. Everything in the admin goes through this interface and never touches
`fs` directly.

That indirection exists for one reason: to make remote publishing (§8) a new
file rather than a rewrite.

---

## 5. Where everything lives

```
content/
  posts/*.md              your posts — the actual content
  about.md                the About page body
public/
  images/                 images added from the editor
  _headers                Cloudflare security + caching headers
src/lib/
  site.ts                 title, description, author, URL, nav   ← edit first
  types.ts                Post / PostFrontmatter shapes
  posts.ts                reads + parses posts at build time
  markdown.ts             markdown → HTML pipeline
  format.ts               date formatting
  storage/index.ts        PostStore interface, getStore(), slugify()
  storage/local.ts        filesystem + git implementation
src/app/
  layout.tsx              header, footer, fonts, site metadata
  globals.css             theme colours + article typography
  page.tsx                home / post list
  posts/[slug]/page.tsx   a post
  tags/page.tsx           tag index
  tags/[tag]/page.tsx     posts for one tag
  about/page.tsx          renders content/about.md
  rss.xml/route.ts        RSS feed (static)
  sitemap.ts              sitemap.xml
  not-found.tsx           404
  admin/layout.dev.tsx    admin chrome            ┐
  admin/page.dev.tsx      post list + publish     │ dev only
  admin/edit/[slug]/…     editor                  │
  api/**/*.dev.ts         save / delete / upload / publish ┘
src/components/admin/
  PostList.tsx            post list + publish panel (client)
  PostEditor.tsx          the editor (client)

tsconfig.json             editor + dev server
tsconfig.build.json       production build only (ignores .next/dev)
wrangler.jsonc            Cloudflare deploy: assets-only Worker serving out/
```

---

## 6. Common changes

### Site name, description, nav, domain

`src/lib/site.ts`. `url` is the real domain — RSS, sitemap and social preview
links are all built from it via `absoluteUrl()`, so it must be the absolute
origin with no trailing slash. Keep `description` under 160 characters; it is
the line both a search result and a feed reader's sidebar show, and both
truncate past roughly that. `intro` is the long version, used on the home page.

### Colours and typography

`src/app/globals.css`. The palette is six CSS variables, defined once for light
and once for dark:

```css
:root            { --background; --foreground; --muted; --border; --accent; }
@media (prefers-color-scheme: dark) { :root { …same names, dark values… } }
```

Change `--accent` and the whole site changes accent colour. Article styling
lives in the `.prose` rules below that.

### Adding a field to posts

Say you want `location`:

1. `src/lib/types.ts` — add `location?: string` to `PostFrontmatter`.
2. `src/lib/posts.ts` — read it in `normalise()`.
3. `src/lib/storage/local.ts` — write it in `serialise()`.
4. `src/app/api/posts/route.dev.ts` — accept it in `parseFrontmatter()`.
5. `src/components/admin/PostEditor.tsx` — add an input (copy the Cover field).
6. `src/app/posts/[slug]/page.tsx` — display it.

### Adding a static page

Create `src/app/uses/page.tsx` and add `{ href: "/uses/", label: "Uses" }` to
`site.nav`. Keep the trailing slash — see §9.

### Comments

Static sites can't store comments, but [Giscus](https://giscus.app) backs them
with GitHub Discussions and is a single client component. Add it at the bottom
of `src/app/posts/[slug]/page.tsx`. Note you'd need to allow its domain in
`public/_headers` CSP.

### Search

Generate a JSON index at build time from `getAllPosts()` and filter it
client-side. Fine up to a few hundred posts.

---

## 7. Deploying

### First deploy

1. Create an empty repo on GitHub (no README — this repo already has one).
2. ```bash
   git remote add origin git@github.com:<you>/<repo>.git
   git add -A
   git commit -m "Initial commit"
   git push -u origin main
   ```
3. Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** →
   **Connect to Git** → pick the repo.
4. Build settings:
   - Build command: `pnpm build`
   - Deploy command: `npx wrangler deploy`
5. **Save and Deploy.**

Cloudflare detects pnpm from the committed `pnpm-lock.yaml` and honours the
`packageManager` field, so there's nothing else to configure. (If a build ever
uses the wrong pnpm, set a `PNPM_VERSION` environment variable in the project
to `10.11.0`.)

Once the remote exists, the admin's **Commit & push** button handles every
subsequent deploy.

### `wrangler.jsonc` — why it must stay committed

The site deploys as an **assets-only Worker**: `wrangler.jsonc` has no `main`
script, just `assets.directory: "./out"`. Cloudflare serves those files from its
edge and never runs any code of ours.

That file is not optional. `wrangler deploy` runs framework auto-detection when
it finds no wrangler config, and its guess for a Next.js repo is a
*server-rendered* app. It then installs `@opennextjs/cloudflare`, rewrites
`package.json`, `next.config.ts` and `public/_headers` in the build container,
and builds against `.next/standalone/` — a directory that only
`output: "standalone"` produces. This project is `output: "export"`, so the
build dies with:

```
Error: ENOENT: no such file or directory, open
  '.../.next/standalone/.next/server/pages-manifest.json'
```

The `pnpm build` step will have *succeeded* just above that, which makes the
failure look mysterious. It isn't — nothing is wrong with the build; the deploy
step threw the build away and tried to make a different kind of app. A present
wrangler config skips auto-detection entirely.

Check a config change without touching production:

```bash
pnpm build && npx wrangler deploy --dry-run
```

It prints how many files it read from `out/`. No account or login needed.

### Custom domain

Worker → **Settings** → **Domains & Routes** → add yours. If the domain is
already on Cloudflare, DNS is automatic. Then update `url` in `src/lib/site.ts`
and push, so RSS and sitemap use the real address.

### What Cloudflare actually does

Clones the repo → `pnpm install --frozen-lockfile` → `pnpm build` →
`npx wrangler deploy` uploads `out/` → serves it from the edge network. No Node
process runs in production. `public/_headers` is applied automatically.

---

## 8. Publishing from anywhere ("Shape B")

Right now the admin only runs on this machine, so you can only post from here.
The blocker is that `local.ts` uses `fs`, and a deployed app has no writable,
persistent filesystem. The fix is to swap *how* files get written:

1. Write `src/lib/storage/github.ts` implementing the same `PostStore`, using
   the GitHub Contents API (`PUT /repos/{owner}/{repo}/contents/{path}`) with a
   fine-grained token scoped to this one repo.
2. Branch in `getStore()`:
   ```ts
   if (process.env.BLOG_STORE === "github") {
     const { githubStore } = await import("@/lib/storage/github");
     return githubStore;
   }
   ```
3. Deploy the admin **as its own app** (a Worker or a small Next app on Vercel)
   behind real authentication. Never merge it into this static site — that would
   throw away the guarantee in §4.

`publish()` becomes a no-op there, since each save is already a commit.

The editor UI, the API validation, and `PostStore` all stay as they are.

---

## 9. Gotchas worth knowing

**Trailing slashes.** `trailingSlash: true` in `next.config.ts` means every URL
ends in `/`. Internal links and `fetch("/api/posts/")` calls must include it, or
you eat a redirect on every request.

**Images aren't optimised.** `output: "export"` has no image server, so
`images.unoptimized` is set and photos are served at full size. A 6 MB phone
photo will be a 6 MB download. Resize before uploading, or add a `sharp` step,
or move images behind Cloudflare Images.

**Images live in git.** Fine for hundreds of photos. If the repo passes ~1 GB,
move `public/images` to R2.

**`.dev.tsx` files are invisible in production.** If you add an admin page and
it 404s locally, check the filename suffix — that's almost always it.

**There are two tsconfigs.** `tsconfig.json` is what your editor and `pnpm write`
use. `tsconfig.build.json` is what `pnpm build` uses (wired up via
`typescript.tsconfigPath` in `next.config.ts`); it's identical except it ignores
`.next/dev`, the route types the dev server generates. Without that split, running
`pnpm build` while `pnpm write` is open in another terminal fails to type check,
because the dev types know about `/admin` and the production route map doesn't.
Edit `tsconfig.json` for real settings — `tsconfig.build.json` inherits them.

**Dates in frontmatter.** YAML turns an unquoted `date: 2026-08-04` into a
timestamp object and a quoted one into a string. `toIsoDate()` in
`src/lib/posts.ts` handles both. Don't "simplify" it away.

---

## 10. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Port 3000 is in use` | Usually an orphaned server from a previous run. `pkill -f "next dev"; pkill -f "next-server"`. Next also just picks the next free port — read the terminal. |
| Build fails: `.next/dev/types/validator.ts ... '/admin' is not assignable` | Dev route types leaking into the build. `tsconfig.build.json` excludes them, so this only bites if you run `next build` directly instead of `pnpm build` — then `rm -rf .next` first. |
| `pnpm install` warns "Ignored build scripts: unrs-resolver" | Shouldn't happen — `pnpm.onlyBuiltDependencies` in `package.json` approves it. If it does, run `pnpm rebuild`. Harmless either way; ESLint has a JS fallback. |
| A `package-lock.json` appeared | Someone ran `npm install`. Delete it, `rm -rf node_modules`, `pnpm install`. Two lockfiles will drift and give you different builds locally and on Cloudflare. |
| `/admin` 404s but the blog itself loads | The dev server died and something stale is answering on that port, or you started it before an edit to `next.config.ts`. Kill it (`pkill -f "next dev"; pkill -f "next-server"`) and run `pnpm write` again. |
| Post doesn't appear on the live site | It's still a draft. Untick **Draft**, save, publish. |
| Post doesn't appear locally either | Filename must be `content/posts/<slug>.md` with valid frontmatter. Check the terminal for a parse error. |
| Image shows as broken | The markdown path must start `/images/…`, and the file must be in `public/images/`. |
| **Commit & push** says "no remote configured" | You haven't run `git remote add origin …` yet (§7). Your work is committed locally, nothing is lost. |
| **Commit & push** fails on the push | Usually SSH/credentials. Run `git push` in a terminal to see the real error. |
| Styles look wrong after editing CSS | Hard reload (`⌘⇧R`). If it persists, restart the dev server. |
| Editor loads but Save does nothing | Open the browser console. A 400 response carries the reason (missing title, bad date, duplicate slug). |
| Everything is broken after a dependency update | `rm -rf .next node_modules && pnpm install`. |
| Cloudflare build fails at the deploy step: `ENOENT ... .next/standalone/.next/server/pages-manifest.json`, after logs about `@opennextjs/cloudflare` | `wrangler.jsonc` is missing or wasn't committed, so `wrangler deploy` auto-detected Next.js and tried to deploy it as a server-rendered app. Restore the file (§7) and push. |
| Cloudflare deploy: `workers.api.error.script_not_found` or it creates a second Worker | The `name` in `wrangler.jsonc` doesn't match the Worker in the dashboard. Make them identical. |

---

## 11. Frontmatter reference

```yaml
---
title: A Walk in Pokhara      # required
date: '2026-08-04'            # required, YYYY-MM-DD
summary: One line for the home page and RSS.
tags:
  - photography
  - nepal
cover: /images/lake.jpg       # optional, shown above the post
draft: false                  # true = local only
---

Body markdown starts here. GitHub-flavoured: tables, task lists,
strikethrough, fenced code blocks with highlighting, footnotes.
```

The editor writes all of this for you — this table is for when you'd rather
edit a file by hand, which is always allowed.
