---
name: ship-check
description: Pre-publish gate for the blog — runs lint and the production build, then checks the repo-specific traps that nothing else catches (draft flag, frontmatter dates, image paths that resolve, oversized images, trailing slashes, wrangler.jsonc still tracked). Use before publishing a post or pushing to main, or when the user says "ship it", "ready to publish?", "check before I push", or asks why a post isn't showing up on the live site.
---

# Ship check

There is no CI on this repo. This skill is the CI. Run every check, report a
single verdict, and do not fix anything until asked.

Run the cheap checks first — a failing frontmatter check should not wait on a
60-second build.

## 1. Content checks

```bash
# Posts still marked draft — these will NOT appear on the live site
grep -l '^draft: true' content/posts/*.md

# Unquoted dates. YAML turns `date: 2026-08-04` into a Date object.
# toIsoDate() in src/lib/posts.ts copes, but quoted is the convention.
grep -n "^date: [0-9]" content/posts/*.md

# Required frontmatter present in every post
for f in content/posts/*.md; do
  grep -q '^title:' "$f" || echo "no title: $f"
  grep -q '^date:'  "$f" || echo "no date: $f"
done

# Every local image referenced actually exists in public/
for f in $(grep -ho '](/images/[^)]*)' content/posts/*.md | sed 's/](//;s/)$//'; \
           grep -h '^cover: ' content/posts/*.md | sed "s/^cover: //;s/'//g" | grep '^/'); do
  [ -f "public$f" ] || echo "MISSING IMAGE: $f"
done

# Weight. No image server (output: export + images.unoptimized), so a 6 MB
# photo is a 6 MB download. Flag anything over 1 MB.
find public/images -type f -size +1M -exec ls -lh {} \; | awk '{print $5, $9}'
```

A remote `cover:` (an `https://` URL) is legitimate — skip those in the path
check, don't report them as missing.

## 2. Repo checks

```bash
# wrangler.jsonc must stay tracked. Without it Cloudflare auto-detects Next.js,
# tries to deploy a server app, and the build dies at the deploy step.
git ls-files --error-unmatch wrangler.jsonc >/dev/null 2>&1 || echo "wrangler.jsonc NOT TRACKED"

# Two lockfiles will drift and give different builds locally and on Cloudflare.
[ -f package-lock.json ] && echo "package-lock.json exists — someone ran npm install"

# Internal links need the trailing slash (trailingSlash: true) or every hit
# eats a redirect. Quote the --include globs: unquoted, zsh tries to expand
# them and the command dies with "no matches found". The [^".] class skips
# real file paths like /rss.xml, which correctly have no trailing slash.
grep -rn 'href="/[a-z][^".]*[^/".]"' src --include='*.tsx' | grep -v 'http'
grep -rn 'fetch("/api/[^"]*[^/"]")' src --include='*.ts' --include='*.tsx' 
```

## 3. Build checks

```bash
pnpm lint
pnpm build
```

If `pnpm build` fails on `.next/dev/types/validator.ts` complaining that
`'/admin'` is not assignable, the dev server's route types leaked in — that
only happens when `next build` is run directly instead of `pnpm build`. Fix
with `rm -rf .next` and re-run `pnpm build`.

If the dev server is running in another terminal, the build still works — that
is exactly what the `tsconfig.build.json` split is for. Don't kill it.

## 4. Verdict

Report in this shape, shortest useful form:

- **Blocking** — build or lint failed, missing image, missing frontmatter,
  untracked `wrangler.jsonc`. These break the site or the deploy.
- **Worth a look** — still-draft posts, images over 1 MB, missing trailing
  slashes. These deploy fine but cost something.
- **Clean** — say so in one line, don't pad it.

If a post the user expects to see is in the still-draft list, say that plainly —
it is the single most common reason a post is missing from the live site.

Then ask whether to fix. Don't start unprompted.
