/**
 * Shared vocabulary for views and reactions.
 *
 * This module is imported by three very different runtimes — the static pages,
 * the browser, and the Cloudflare Worker in `worker/` — so it must stay free of
 * imports. In particular it must not reach for `@/lib/constants`, whose
 * `process.env` access does not exist in a Worker without `nodejs_compat`.
 */

export const REACTIONS = [
  { kind: "love", emoji: "❤️", label: "Loved it" },
  { kind: "clap", emoji: "👏", label: "Nice work" },
  { kind: "insight", emoji: "💡", label: "Learned something" },
  { kind: "think", emoji: "🤔", label: "Made me think" },
] as const;

export type ReactionKind = (typeof REACTIONS)[number]["kind"];

export type ReactionCounts = Record<ReactionKind, number>;

/** What both endpoints return. `mine` is what *this* visitor has reacted with. */
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
