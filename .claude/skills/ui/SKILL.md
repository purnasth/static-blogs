---
name: ui
description: The design vocabulary for this blog's components — semantic colour tokens, the ui/ primitives, and the const-object-not-enum rule. Load BEFORE writing or editing any .tsx file in src/components or src/app, so components reuse Panel/Button/Badge/Notice and semantic tones instead of raw Tailwind colour classes. Use when adding a component, a page, an admin screen, or restyling anything.
---

# UI conventions

This project has a real design system. The default instinct — `bg-red-50`,
`text-gray-500`, a hand-rolled `<div className="rounded border">` — breaks it
every time. Read this before writing JSX.

## Rule 1 — never a raw Tailwind colour

`src/components/ui/tone.ts` opens with: *"Semantic colour vocabulary:
components map through these, never raw colour classes."* Honour it.

The tokens are defined in `src/app/globals.css` and are theme-aware, so they
work in light and dark without a `dark:` variant. Use these, not palette
classes:

| Purpose | Class |
| --- | --- |
| Page / raised / inset / active surface | `bg-background` `bg-raised` `bg-inset` `bg-active` |
| Body / secondary / faint text | `text-foreground` `text-muted` `text-subtle` |
| Borders | `border-line` `border-line-strong` |
| Brand | `bg-accent` `text-accent` `text-accent-contrast` `bg-accent-soft` `border-accent-line` |
| Status | `{ok,warn,danger}` × `text-` / `bg-…-soft` / `border-…-line` |

Never write `dark:` for colour — the tokens already flip. Type sizes are tokens
too: `text-hero` `text-display` `text-title` `text-lede` `text-body`
`text-meta` `text-ui` `text-micro`. Don't use `text-sm`/`text-xs` for content
metadata; use `text-meta`.

For a status colour chosen at runtime, map through `TONE_SOFT`, `TONE_DOT` or
`TONE_TEXT` keyed by `Tone` — never build the class string by concatenation,
Tailwind cannot see it.

## Rule 2 — reuse the primitives

Everything is re-exported from `@/components/ui`:

```
Badge, StatusBadge      Button, ButtonLink       ConfirmDialog
Field, Input, inputClass  LinkRow, LinkList      MetaRow
Notice (NoticeKind, NoticeState)                 Panel, PanelHeader
SegmentedControl (Segment)                       TONE_SOFT/DOT/TEXT, Tone
```

Import as `import { Panel, Button } from "@/components/ui";`. Before writing a
card, a pill, a form row, a confirm flow or a status message, check whether one
of these already is it. `Panel` + `PanelHeader` is the standard section
container — a bordered rounded box you write by hand is a bug.

`Button` has five variants and the distinction matters: `danger` is the quiet
entry point that *opens* a destructive dialog; `destructive` is the loud
confirming button *inside* it. Use `ButtonLink` when it is genuinely
navigation, not a click handler.

## Rule 3 — const objects, not `enum`

`src/lib/enums.ts` says why: *"no runtime emit, and they narrow structurally."*
New closed sets go there in the same shape:

```ts
export const Thing = { A: "a", B: "b" } as const;
export type Thing = (typeof Thing)[keyof typeof Thing];
```

## Rule 4 — where the file goes

- `src/components/ui/` — generic primitives only, no blog knowledge. Add the
  export to `ui/index.ts`.
- `src/components/` — blog-specific pieces (`PostRow`, `Tag`, `ShareLinks`).
- `src/components/engagement/` — anything touching views or reactions.
- `src/components/admin/` — writing-desk UI. Client components.
- Anything under `src/app/admin/` or `src/app/api/` **must** be named
  `*.dev.tsx` / `*.dev.ts`, or it ships to the public site.

Server components by default. Add `"use client"` only for state, effects or
event handlers — and know that a client component under `src/app` still gets
statically exported, so it cannot read the filesystem.

Icons: `lucide-react` for UI. `react-icons` only for brand marks (the share
links), because lucide deliberately dropped brand logos.
