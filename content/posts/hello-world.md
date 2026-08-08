---
title: Hello, world
date: 2026-08-04
summary: How this blog is put together, and how to write the next post.
tags:
  - meta
draft: false
---

This site is a **static blog**: every page you're reading was rendered to plain
HTML at build time. There is no database, no server-side code, and nothing to
log into. That is the whole point — a static site is very hard to attack and
very cheap to host.

## Writing a post

Posts are markdown files in `content/posts/`. But you don't have to touch them
by hand. Run the writing desk locally:

```bash
pnpm dev
```

Then open [localhost:3000/admin](http://localhost:3000/admin). Write the post in
a normal editor, drag images straight into the text, and hit **Save** — the file
is written to disk for you. When you're happy, hit **Commit & push** and the
host rebuilds the site.

## Images

Drop an image anywhere in the editor and it lands in `public/images/`, with the
markdown inserted at your cursor. They're committed alongside the post, so the
post and its pictures always travel together.

## What ships

The `/admin` UI and everything under `/api` exist only while you're writing.
They are excluded from the production build, so the deployed site is HTML, CSS
and a little JavaScript — nothing that can be broken into.
