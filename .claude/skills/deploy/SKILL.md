---
name: deploy
description: Get the blog live on Cloudflare, or diagnose a failed deploy. Use when the user says "deploy", "push it live", "the site didn't update", "the Cloudflare build failed", or asks about wrangler, the custom domain, or why a change isn't showing on the real site.
---

# Deploy

`DEVELOPING.md` §7 is the reference — read it before answering anything not
covered here. This skill is the fast path and the failure triage.

## The normal case

There is nothing to run. Cloudflare builds on push to `main`:

```
clone → pnpm install --frozen-lockfile → pnpm build → npx wrangler deploy
```

which uploads `out/` as static assets and bundles `worker/index.ts` for
`/api/*`. No Node process runs in production. The admin's **Commit & push**
button on `/admin` does the push, so the user usually never touches a terminal.

Before pushing, run `/ship-check`. There is no CI — a broken build is
discovered on Cloudflare, not locally.

Test a config change without touching production:

```bash
pnpm build && npx wrangler deploy --dry-run   # no account or login needed
```

## First deploy only

1. `git remote add origin git@github.com:<you>/<repo>.git` then push `main`.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** →
   **Connect to Git**.
3. Build command `pnpm build`, deploy command `npx wrangler deploy`.

pnpm is detected from the committed lockfile and `packageManager`. Engagement
also needs its D1 table set up once — see `/d1`.

## When it fails

| Symptom | What it actually is |
| --- | --- |
| `ENOENT … .next/standalone/.next/server/pages-manifest.json`, after logs mentioning `@opennextjs/cloudflare` | `wrangler.jsonc` missing or uncommitted. With no config, `wrangler deploy` auto-detects Next.js, assumes a *server-rendered* app, and builds against a directory `output: "export"` never produces. The `pnpm build` above it **succeeded** — that's what makes it look mysterious. Restore and commit the file. |
| `workers.api.error.script_not_found`, or a second Worker appears | `name` in `wrangler.jsonc` (`static-blogs`) doesn't match the Worker in the dashboard. Make them identical. |
| Build uses the wrong pnpm | Set `PNPM_VERSION=10.11.0` in the project's environment variables. |
| Site deploys but a post is missing | It's still `draft: true`. Not a deploy problem. |
| RSS, sitemap or social previews show the wrong domain | `url` in `src/lib/site.ts` is still the old address. |

The single highest-value check when a deploy misbehaves:

```bash
git ls-files --error-unmatch wrangler.jsonc
```

That file is load-bearing. Never delete it to "clean up", and never let a
`.gitignore` swallow it.

## Custom domain

Worker → **Settings** → **Domains & Routes** → add it. Then update `url` in
`src/lib/site.ts` and push, or RSS and the sitemap keep advertising the old one.
