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
| http://localhost:5050 | the blog, exactly as visitors will see it |
| http://localhost:5050/admin | the writing desk (only exists locally) |

### About the port ⚠️ temporary

Next's default is 3000, but this project starts at **5050** because 3000 kept
getting taken by other things running at the same time.

You should never see an "address already in use" error: `pnpm write` goes
through `scripts/dev-port.mjs`, which scans upward from 5050 and takes the first
**free** port, printing which one it picked. Plain `next dev -p 5050` would just
die, and Next's own auto-increment only kicks in when no port is specified —
starting from 3000, the port we're avoiding.

To scan from a different base:

```bash
PORT=7000 pnpm write
```

Not 5000 — on macOS that port belongs to ControlCenter (AirPlay Receiver), so
binding it fails. **This is a temporary workaround; [TODO.md](./TODO.md) has the
checklist for reverting to 3000.**

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
the parent leaves the port held. That is the usual cause of "Port 5050 is in use"
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

## 2. The everyday writing loop

1. `pnpm write`
2. Go to http://localhost:5050/admin
3. **New post** → write it. `⌘S` (or the Save button) writes
   `content/posts/<slug>.md` to disk. Save as often as you like; it's just a file.
4. Drag images into the editor. They land in `public/images/` and the markdown
   is inserted where your cursor was.
5. Untick **Draft** when it's ready to be public.
6. Back at `/admin`, type a short note in the Publish box and hit
   **Commit & push**.
7. Cloudflare sees the push, runs `pnpm build`, and the post is live in about
   a minute.

Nothing is published until step 6. Everything before that is local files.

### Drafts

`draft: true` posts show up on your local site (so you can preview them
properly) and are stripped from the built site — they're not in the HTML, not in
the RSS feed, not in the sitemap. The switch is in `src/lib/posts.ts`:

```ts
const showDrafts = process.env.NODE_ENV === "development";
```

---

## 3. How it fits together

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

That indirection exists for one reason: to make remote publishing (§7) a new
file rather than a rewrite.

---

## 4. Where everything lives

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
```

---

## 5. Common changes

### Site name, description, nav, domain

`src/lib/site.ts`. **Set `url` to your real domain before deploying** — RSS,
sitemap and social preview links are built from it.

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
`site.nav`. Keep the trailing slash — see §8.

### Comments

Static sites can't store comments, but [Giscus](https://giscus.app) backs them
with GitHub Discussions and is a single client component. Add it at the bottom
of `src/app/posts/[slug]/page.tsx`. Note you'd need to allow its domain in
`public/_headers` CSP.

### Search

Generate a JSON index at build time from `getAllPosts()` and filter it
client-side. Fine up to a few hundred posts.

---

## 6. Deploying

### First deploy

1. Create an empty repo on GitHub (no README — this repo already has one).
2. ```bash
   git remote add origin git@github.com:<you>/<repo>.git
   git add -A
   git commit -m "Initial commit"
   git push -u origin main
   ```
3. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick the repo.
4. Build settings:
   - Framework preset: **None**
   - Build command: `pnpm build`
   - Build output directory: `out`
5. **Save and Deploy.**

Cloudflare detects pnpm from the committed `pnpm-lock.yaml` and honours the
`packageManager` field, so there's nothing else to configure. (If a build ever
uses the wrong pnpm, set a `PNPM_VERSION` environment variable in the Pages
project to `10.11.0`.)

Once the remote exists, the admin's **Commit & push** button handles every
subsequent deploy.

### Custom domain

Pages project → **Custom domains** → add yours. If the domain is already on
Cloudflare, DNS is automatic. Then update `url` in `src/lib/site.ts` and push,
so RSS and sitemap use the real address.

### What Cloudflare actually does

Clones the repo → `pnpm install --frozen-lockfile` → `pnpm build` → serves
`out/` from its edge network. No Node process runs in production.
`public/_headers` is applied automatically.

---

## 7. Publishing from anywhere ("Shape B")

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
   throw away the guarantee in §3.

`publish()` becomes a no-op there, since each save is already a commit.

The editor UI, the API validation, and `PostStore` all stay as they are.

---

## 8. Gotchas worth knowing

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

## 9. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Port 5050 is in use` | Usually an orphaned server from a previous run. `pkill -f "next dev"; pkill -f "next-server"`. Next also just picks the next free port — read the terminal. |
| Build fails: `.next/dev/types/validator.ts ... '/admin' is not assignable` | Dev route types leaking into the build. `tsconfig.build.json` excludes them, so this only bites if you run `next build` directly instead of `pnpm build` — then `rm -rf .next` first. |
| `pnpm install` warns "Ignored build scripts: unrs-resolver" | Shouldn't happen — `pnpm.onlyBuiltDependencies` in `package.json` approves it. If it does, run `pnpm rebuild`. Harmless either way; ESLint has a JS fallback. |
| A `package-lock.json` appeared | Someone ran `npm install`. Delete it, `rm -rf node_modules`, `pnpm install`. Two lockfiles will drift and give you different builds locally and on Cloudflare. |
| `/admin` 404s but the blog itself loads | The dev server died and something stale is answering on that port, or you started it before an edit to `next.config.ts`. Kill it (`pkill -f "next dev"; pkill -f "next-server"`) and run `pnpm write` again. |
| Post doesn't appear on the live site | It's still a draft. Untick **Draft**, save, publish. |
| Post doesn't appear locally either | Filename must be `content/posts/<slug>.md` with valid frontmatter. Check the terminal for a parse error. |
| Image shows as broken | The markdown path must start `/images/…`, and the file must be in `public/images/`. |
| **Commit & push** says "no remote configured" | You haven't run `git remote add origin …` yet (§6). Your work is committed locally, nothing is lost. |
| **Commit & push** fails on the push | Usually SSH/credentials. Run `git push` in a terminal to see the real error. |
| Styles look wrong after editing CSS | Hard reload (`⌘⇧R`). If it persists, restart the dev server. |
| Editor loads but Save does nothing | Open the browser console. A 400 response carries the reason (missing title, bad date, duplicate slug). |
| Everything is broken after a dependency update | `rm -rf .next node_modules && pnpm install`. |

---

## 10. Frontmatter reference

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
