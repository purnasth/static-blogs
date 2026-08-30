# Skills

Six commands that teach Claude Code the things about this repo it cannot guess.
They live here so they're committed with the code — clone the repo and you get
them.

## How a skill works, in four lines

A skill is a folder holding one `SKILL.md`. The folder name becomes the
command. The file starts with a small YAML header — `name` and `description` —
and everything below it is plain-English instructions for Claude.

The `description` is the important part. It's the **only** thing Claude reads
until the skill actually fires, and it's what decides whether to load it. So
each description below lists the phrases you'd genuinely type. You mostly don't
need to remember the slash commands: say *"is this ready to publish?"* and
`/ship-check` loads itself.

New or renamed skills are picked up when a session starts. If a command doesn't
autocomplete, restart Claude Code.

---

## `/ship-check` — before you publish

**Purpose.** This repo has no CI. Nothing checks a build before Cloudflare
tries it, and nothing tells you a post is invisible because it's still a draft.
This is that safety net.

**Use it** before pushing, before publishing a post, or when a post isn't
showing up on the live site.

```
/ship-check
```

Also fires on: *"ready to publish?"*, *"check this before I push"*, *"why isn't
my post on the site?"*

It runs `pnpm lint` and `pnpm build`, then the traps generic tooling misses:
still-`draft: true` posts, unquoted frontmatter dates, `/images/…` references
pointing at files that don't exist, images over 1 MB (there's no image
optimiser — a 6 MB photo is a 6 MB download), internal links missing the
trailing slash, and whether `wrangler.jsonc` is still tracked by git.

You get a verdict split into **blocking** and **worth a look**. It won't change
anything until you say so.

---

## `/ui` — before writing a component

**Purpose.** `src/components/ui/tone.ts` says *"components map through these,
never raw colour classes"* — and a fresh Claude session has no idea. Left
alone, it writes `bg-red-50`, adds `dark:` variants you don't need, and rebuilds
`Panel` as a bare div. This loads your vocabulary first.

**Use it** when adding or restyling anything with JSX in it.

```
/ui  then: add a "copy link" button to the post header
```

Also fires on: *"add a component"*, *"restyle the…"*, *"new admin page"*

Covers the semantic tokens (`bg-raised`, `text-muted`, `border-line`,
`text-meta`, the `ok`/`warn`/`danger` families), the primitives exported from
`@/components/ui`, the `danger` vs `destructive` button distinction, the
const-object-instead-of-`enum` rule, and the `.dev.tsx` suffix requirement for
anything under `admin/` or `api/`.

---

## `/draft` — writing a post

**Purpose.** Scaffold a post with frontmatter that's actually valid, or get a
line-edit that doesn't flatten your voice.

**Use it** to start a post from an idea, or to tighten one that exists.

```
/draft  a post about why I stopped using a CMS
/draft content/posts/hop-commit-and-leap.md
```

Also fires on: *"new post"*, *"tighten this draft"*, *"proofread this"*

Starting: writes `content/posts/<slug>.md`, quoted date, `draft: true` always —
publishing stays your decision, it will never flip that flag for you.

Editing: it has your voice from your existing posts, so the puns and the
asides survive. It targets passive constructions, sentences carrying two ideas,
ledes that circle before landing. Changes come as before/after, not a silent
rewrite.

**Note:** the `/admin` editor already handles slugs, saving, image upload and
publishing, and it's faster than Claude for a blank page. Use this skill for
the *writing*, not the file mechanics.

---

## `/grill-me` — pressure-test it

**Purpose.** The opposite of `/draft`. It doesn't fix anything; it asks the
questions a hostile reader would, so you find the holes first.

**Use it** on a finished draft, a design decision, or an argument you're not
sure about.

```
/grill-me content/posts/hop-commit-and-leap.md
/grill-me                      # grills your current git diff
/grill-me "static export vs SSR"
```

Also fires on: *"poke holes in this"*, *"play devil's advocate"*, *"what am I
missing?"*

One question at a time — it waits for your answer, pushes back once if the
answer is thin, then moves on. No compliments, no rewriting, always quoting the
exact sentence or `file.ts:42`. Stops around 6–8 questions and ends with your
weakest point and a ship / don't-ship call.

Natural pairing: `/draft` to write it, `/grill-me` to break it, `/draft` again
to fix what broke.

---

## `/deploy` — getting it live, or working out why it isn't

**Purpose.** Mostly triage. Cloudflare's failure messages for this project are
actively misleading — the build *succeeds*, then the deploy step throws it away
and fails looking for a directory a static export never produces.

**Use it** for the first deploy, or any time a deploy misbehaves.

```
/deploy
/deploy  the cloudflare build failed
```

Also fires on: *"push it live"*, *"the site didn't update"*

Day to day there's nothing to run — Cloudflare builds on push to `main`, and
the admin's **Commit & push** button does the push. The skill's real value is
the failure table: the `.next/standalone` error means `wrangler.jsonc` went
missing, `script_not_found` means the Worker name drifted, and a missing post
usually just means it's still a draft.

---

## `/d1` — the view and reaction data

**Purpose.** Engagement is the one non-static part of the site. This covers
where the numbers live and the privacy rules you must not break.

**Use it** to query real counts, change the schema, or debug odd numbers.

```
/d1  which posts have the most views?
```

Also fires on: *"view counts"*, *"reactions aren't working"*, *"the stats
dashboard shows…"*

The first thing it establishes is which world you're in: **locally the counts
are in-memory and reset with the dev server** — local numbers mean nothing.
Production is D1. `pnpm db:pull` snapshots the real data to
`.local/engagement.db` for DBeaver or `sqlite3`.

It also carries the constraint that matters: visitors are a salted hash that
rotates daily and **no IP is ever stored**. That's the whole reason this site
has no cookie banner. Don't let anything "simplify" it into a stable id.

---

## Changing them

Edit `<name>/SKILL.md` — it's just markdown, and you can write instructions in
your own words. Rename the folder to rename the command. `rm -rf <name>/` to
delete one; nothing else needs unwinding.

To add one, copy the shape of an existing file. Spend your effort on the
`description` — a skill with a vague description never loads, no matter how
good the body is. Then add a row to the table in `CLAUDE.md` and a section
here.
