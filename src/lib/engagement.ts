/**
 * Shared vocabulary for views and reactions.
 *
 * This module is imported by three very different runtimes — the static pages,
 * the browser, and the Cloudflare Worker in `worker/` — so it must stay free of
 * imports. In particular it must not reach for `@/lib/constants`, whose
 * `process.env` access does not exist in a Worker without `nodejs_compat`.
 */

/**
 * The four reactions, in display order.
 *
 * Icons are deliberately NOT here. This module is imported by the Cloudflare
 * Worker, and naming a React component in it would drag the renderer into an
 * edge bundle. `ReactionBar` maps kind -> icon on the client instead.
 *
 * `kind` is the value stored in D1, so renaming one orphans its existing rows.
 */
export const REACTIONS = [
  { kind: "love", label: "Loved it" },
  { kind: "celebrate", label: "Nice work" },
  { kind: "insight", label: "Learned something" },
  { kind: "inspire", label: "Inspiring" },
] as const;

export type ReactionKind = (typeof REACTIONS)[number]["kind"];

export type ReactionCounts = Record<ReactionKind, number>;

/** Aggregate counts for one post. No `mine` — this is nobody's in particular. */
export type PostTotals = {
  views: number;
  reactions: ReactionCounts;
};

/** What `/api/summary` returns, keyed by slug. */
export type EngagementSummary = Record<string, PostTotals>;

/** What both engagement endpoints return. `mine` is *this* visitor's. */
export type Engagement = {
  views: number;
  reactions: ReactionCounts;
  mine: ReactionKind[];
};

const KINDS: readonly string[] = REACTIONS.map((r) => r.kind);

export function isReactionKind(value: unknown): value is ReactionKind {
  return typeof value === "string" && KINDS.includes(value);
}

export function emptyCounts(): ReactionCounts {
  return Object.fromEntries(REACTIONS.map((r) => [r.kind, 0])) as ReactionCounts;
}

export function emptyEngagement(): Engagement {
  return { views: 0, reactions: emptyCounts(), mine: [] };
}

/**
 * Slugs come off the wire, so they are bounded and character-restricted before
 * they ever reach a query. Mirrors the shape `@/lib/slug` produces.
 */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

/**
 * The reaction identity: a random id the browser mints once and keeps. It is
 * not a login and it is trivially forgeable — it exists so a visitor's own
 * reactions survive a reload, not to prove who they are. Abuse is bounded by
 * the server-side per-IP limits in the Worker, never by this value.
 */
export const VISITOR_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const VISITOR_STORAGE_KEY = "visitor-id";

/**
 * Trailing slashes to match `trailingSlash: true` in next.config.ts. Without
 * them `next dev` answers every write with a 308 to the slashed form — browsers
 * do replay a POST across that, but it doubles the round trip for nothing. The
 * Worker normalises either spelling.
 */
export const ENGAGEMENT_ENDPOINT = "/api/engagement/";
export const REACT_ENDPOINT = "/api/react/";

/**
 * Bulk totals for every post, for the listings. GET and identical for everyone,
 * so unlike the two above it can be cached at the edge.
 */
export const SUMMARY_ENDPOINT = "/api/summary/";

/** Read the stored reaction identity, minting one on first visit. */
export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing && VISITOR_PATTERN.test(existing)) return existing;

    const minted = crypto.randomUUID();
    localStorage.setItem(VISITOR_STORAGE_KEY, minted);
    return minted;
  } catch {
    // Private mode or storage disabled: still usable, just not across reloads.
    return crypto.randomUUID();
  }
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/** How far through a post the floating reaction bar appears. */
export const STICKY_REACTIONS_AT = 0.6;

/** Anchors the floating bar's "is the real one already on screen?" check. */
export const REACTION_BAR_ID = "reactions";
