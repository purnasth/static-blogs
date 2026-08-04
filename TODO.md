# TODO

## TODO: revert the dev port from 5050 back to 3000

**Added:** 2026-08-04 · **Status:** temporary workaround, still in place

### Why it's like this

Next's default port is 3000. Several agent modules were running at once and kept
taking it, so the dev server now starts on **5050**.

It is *not* on 5000, despite that being the port originally asked for: on macOS,
port 5000 is owned by **ControlCenter (AirPlay Receiver)**, a system service.
Anything binding there conflicts immediately. If you ever want 5000, turn off
System Settings → General → AirDrop & Handoff → **AirPlay Receiver** first.

5050 was chosen because it was free and isn't a common default — unlike 8080,
3333 or 4321, which other tools grab.

### Why a fixed port isn't enough

A hardcoded port still fails the moment anything else holds it —
`next dev -p 5050` exits with `EADDRINUSE`, it does not fall back. So
`pnpm dev` and `pnpm write` go through **`scripts/dev-port.mjs`**, which probes
upward from the base port and launches on the first genuinely free one, printing
`Port 5050 is busy — using 5051 instead.` when it moves.

(Next's own auto-increment only applies when no `-p` is passed, and it starts
from 3000 — the port this whole workaround exists to avoid.)

### How to change the port right now (no edits needed)

```bash
PORT=7000 pnpm write
```

`PORT` sets the *base* of the scan, not a fixed port — if 7000 is taken it tries
7001 and up.

### How to revert to 3000 when the port pressure is gone

1. `package.json` — point `dev` and `write` back at plain `next dev`, and
   `start` at plain `next start`.
2. Delete `scripts/dev-port.mjs` (and the `scripts/` directory if it's empty).
3. `package.json` — delete the `"//TODO:port"` key.
4. Swap the port everywhere in the docs and the seed post:
   ```bash
   perl -pi -e 's/5050/3000/g' README.md DEVELOPING.md content/posts/hello-world.md
   ```
   (5 mentions in `README.md`, 8 in `DEVELOPING.md`, 1 in the seed post, as of
   writing.)
5. `README.md` — delete the "Note:" block under **Running it** about the port.
6. `DEVELOPING.md` — delete the "About the port ⚠️ temporary" subsection in §1.
   Keep the paragraph about Next allowing only one dev server per directory;
   that's true regardless of port.
7. Delete this file, or strike this item.

Then confirm nothing was missed:

```bash
grep -rn "5050" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=out .
```

### Not affected

Nothing about the deployed site. The port only exists while you're writing
locally; `pnpm build` produces static files with no server and no port at all.
