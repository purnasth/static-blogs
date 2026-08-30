---
name: draft
description: Start a new blog post with valid frontmatter, or do a line-editing pass on an existing draft in the author's voice. Use when the user says "new post", "start a draft", "write up X", "edit this post", "tighten this draft", or asks for a proofread of anything in content/posts/.
---

# Draft

Two jobs. Work out which from the ask: no file yet → **start one**; a file
named → **edit it**.

The `/admin` editor at `http://localhost:<port>/admin` already handles the file
mechanics (slug, save, image upload, publish). Use this skill for the writing,
not to replace that UI. If the user just wants a blank post to type into, point
them at **New post** in the editor instead — it is faster than you.

## Starting one

Write `content/posts/<slug>.md`. Slug: lowercase, hyphenated, derived from the
title, no dates in it.

```yaml
---
title: 'Hop, Commit and Leap'   # required
date: '2026-08-30'              # required, QUOTED, YYYY-MM-DD
summary: >-                     # one line; shows on the home page and in RSS
  The sentence that makes someone click.
tags:
  - github
  - growth
draft: true                     # start true, always
cover: /images/something.jpg    # optional; local path or an https:// URL
---
```

Quote the date. Unquoted YAML makes it a Date object — `toIsoDate()` in
`src/lib/posts.ts` handles it, but the convention here is quoted. Long titles
and summaries use `>-` folded scalars, as the existing posts do.

Start `draft: true` every time. It stays local until the user unticks Draft in
the editor. Never flip it to `false` on your own — that is the publish
decision, and it is theirs.

Body is GitHub-flavoured markdown: tables, task lists, footnotes, fenced code
with highlighting. Structure with `##` — `#` is the title and comes from
frontmatter. Images go `![alt](/images/name.jpg)` with the file in
`public/images/`; there is no image optimiser, so nothing over ~1 MB.

## Editing one

The author's voice, from the existing posts — match it, do not sand it down:

- Playful and personal. Wordplay and puns are deliberate ("commit-ment",
  "code-ribution"), not accidents to correct.
- Speaks to the reader directly — "dear reader", rhetorical questions, the
  occasional acknowledged tangent.
- **Bold** for emphasis inside a sentence; block quotes for the line the post
  is built around.
- British-ish spelling in the repo's own docs ("colours", "optimised") — follow
  whatever the file already does rather than imposing one.

What to change: passive constructions that hide who did the thing; sentences
carrying two ideas; a lede that circles before landing; repetition the author
cannot see because they wrote it in one sitting; a `summary:` longer than one
line.

What to leave alone: the jokes, the voice, the digressions that are signposted,
their word choices when yours are only differently good.

Show the edit as a diff or as before/after pairs for anything beyond a typo.
Do not silently rewrite paragraphs — the post is theirs.

When the draft is in decent shape, offer `/grill-me <path>` to pressure-test
the argument. This skill fixes prose; that one finds the holes.
