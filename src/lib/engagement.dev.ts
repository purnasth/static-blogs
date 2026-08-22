/**
 * Dev-only stand-in for the Cloudflare Worker in `worker/`.
 *
 * `next dev` runs no Worker, so without this the reaction bar would be dead on
 * every local page. This keeps the same shapes in memory: counts reset when the
 * dev server restarts, which is what you want while styling the thing.
 *
 * The `.dev.ts` suffix keeps it out of the production type-check and, because
 * nothing in the static build imports it, out of the bundle. See next.config.ts.
 */

import { emptyCounts, isReactionKind, type Engagement, type ReactionKind } from "@/lib/engagement";

const views = new Map<string, number>();
const reactions = new Map<string, Set<ReactionKind>>();

const key = (slug: string, visitor: string) => `${slug}::${visitor}`;

export function read(slug: string, visitor: string): Engagement {
  const counts = emptyCounts();

  for (const [id, kinds] of reactions) {
    if (!id.startsWith(`${slug}::`)) continue;
    for (const kind of kinds) counts[kind] += 1;
  }

  return {
    views: views.get(slug) ?? 0,
    reactions: counts,
    mine: [...(reactions.get(key(slug, visitor)) ?? [])],
  };
}

/** Unlike the Worker there is no dedupe — a reload should visibly tick up. */
export function recordView(slug: string, visitor: string): Engagement {
  views.set(slug, (views.get(slug) ?? 0) + 1);
  return read(slug, visitor);
}

export function toggleReaction(slug: string, visitor: string, kind: unknown): Engagement {
  if (!isReactionKind(kind)) return read(slug, visitor);

  const id = key(slug, visitor);
  const held = reactions.get(id) ?? new Set<ReactionKind>();
  if (held.has(kind)) held.delete(kind);
  else held.add(kind);
  reactions.set(id, held);

  return read(slug, visitor);
}
