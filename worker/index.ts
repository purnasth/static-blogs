/**
 * The engagement API — the one piece of this site that is not static.
 *
 * The blog itself is still a pure static export served straight off Cloudflare's
 * edge. `assets.run_worker_first` in wrangler.jsonc routes only `/api/*` here;
 * every page, script and image is answered by the asset worker exactly as
 * before, and never touches this code.
 *
 * There are no accounts. Two different identities do the work instead:
 *
 *   dailyHash(...)  A salted SHA-256 of IP + user-agent that rotates every UTC
 *                   midnight. Used for view dedupe and for rate limiting. It is
 *                   irreversible and short-lived, so no IP is ever stored.
 *
 *   visitor         A random uuid the browser mints and keeps. Used as the
 *                   reaction identity so a visitor's own hearts survive a
 *                   reload. Forgeable by design — it buys continuity, not
 *                   trust, and abuse is bounded by the daily hash above.
 *
 * See DEVELOPING.md §12.
 */

import {
  emptyCounts,
  isReactionKind,
  SLUG_PATTERN,
  VISITOR_PATTERN,
  type Engagement,
  type EngagementSummary,
  type ReactionCounts,
  type ReactionKind,
} from "../src/lib/engagement";

/**
 * Hand-written rather than pulled from `@cloudflare/workers-types`: this is all
 * of the D1 surface we touch, and it keeps the deploy machine's install small.
 */
type D1Meta = { changes: number };
type D1Result<T> = { results: T[]; meta: D1Meta };

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<Record<string, unknown>>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]>;
}

type ExecutionContext = { waitUntil(promise: Promise<unknown>): void };

type WorkerCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};

/** `caches.default` is a Workers extension the DOM's CacheStorage type lacks. */
const edgeCache = (): WorkerCache => (caches as unknown as { default: WorkerCache }).default;

type Env = {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Worker secret. Without it the daily hashes become guessable — see README. */
  VISITOR_SALT?: string;
};

/**
 * Daily write budgets per IP. A human reading every post on the site lands
 * nowhere near these; a script hits them in seconds.
 */
const LIMITS = { engagement: 400, react: 80 } as const;

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * A per-day pseudonym. `scope` separates the two uses: view dedupe is per post
 * (so reading ten posts is ten views), rate limiting is site-wide (so it cannot
 * be sidestepped by moving to the next post).
 */
function dailyHash(request: Request, env: Env, scope: string): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip") ?? "";
  const agent = request.headers.get("user-agent") ?? "";
  return sha256(`${env.VISITOR_SALT ?? "unsalted"}|${utcDay()}|${scope}|${ip}|${agent}`);
}

// ---------------------------------------------------------------------------
// Request guards
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Per-visitor and always changing: never let an edge or browser hold it.
      "cache-control": "no-store",
    },
  });
}

/**
 * Only this site's own pages may write. A cross-site `fetch` still carries the
 * attacker's Origin, and a scripted client that forges one is left to the rate
 * limiter — this is the cheap first filter, not the whole defence.
 */
function isSameOrigin(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;

  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}

/** Returns false once the caller is over budget for the day. */
async function withinBudget(db: D1Database, bucket: string, limit: number): Promise<boolean> {
  const { results } = await db
    .prepare(
      `INSERT INTO rate_limit (bucket, day, hits) VALUES (?1, ?2, 1)
         ON CONFLICT(bucket) DO UPDATE SET hits = hits + 1
       RETURNING hits`,
    )
    .bind(bucket, utcDay())
    .all<{ hits: number }>();

  return (results[0]?.hits ?? 0) <= limit;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = await request.json();
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** The three reads every response ends with, sent as one round trip. */
async function readEngagement(
  db: D1Database,
  slug: string,
  visitor: string,
): Promise<Engagement> {
  const [views, totals, mine] = await db.batch([
    db.prepare(`SELECT views FROM post_views WHERE slug = ?1`).bind(slug),
    db.prepare(`SELECT kind, COUNT(*) AS n FROM reactions WHERE slug = ?1 GROUP BY kind`).bind(slug),
    db.prepare(`SELECT kind FROM reactions WHERE slug = ?1 AND visitor = ?2`).bind(slug, visitor),
  ]);

  const reactions: ReactionCounts = emptyCounts();
  for (const row of totals.results as { kind: string; n: number }[]) {
    if (isReactionKind(row.kind)) reactions[row.kind] = row.n;
  }

  return {
    views: (views.results as { views: number }[])[0]?.views ?? 0,
    reactions,
    mine: (mine.results as { kind: string }[]).map((r) => r.kind).filter(isReactionKind),
  };
}

/** POST /api/engagement — record one view per visitor per post per day. */
async function handleEngagement(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const slug = String(body.slug ?? "");
  const visitor = String(body.visitor ?? "");

  if (!SLUG_PATTERN.test(slug) || !VISITOR_PATTERN.test(visitor)) {
    return json({ error: "bad request" }, 400);
  }

  const limiter = await dailyHash(request, env, "limit");
  if (!(await withinBudget(env.DB, `engagement:${limiter}`, LIMITS.engagement))) {
    // Reads still succeed — throttling should hide the buttons from nobody.
    return json(await readEngagement(env.DB, slug, visitor));
  }

  // INSERT OR IGNORE is the dedupe: a second view today changes no rows, so the
  // running total is only bumped on the first one.
  const reader = await dailyHash(request, env, `view:${slug}`);
  const claimed = await env.DB.prepare(
    `INSERT OR IGNORE INTO post_view_visitors (slug, visitor, day) VALUES (?1, ?2, ?3)`,
  )
    .bind(slug, reader, utcDay())
    .run();

  if (claimed.meta.changes > 0) {
    await env.DB.prepare(
      `INSERT INTO post_views (slug, views) VALUES (?1, 1)
         ON CONFLICT(slug) DO UPDATE SET views = views + 1`,
    )
      .bind(slug)
      .run();
  }

  return json(await readEngagement(env.DB, slug, visitor));
}

/** POST /api/react — toggle one reaction on or off. */
async function handleReact(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const slug = String(body.slug ?? "");
  const visitor = String(body.visitor ?? "");
  const kind: unknown = body.kind;

  if (!SLUG_PATTERN.test(slug) || !VISITOR_PATTERN.test(visitor) || !isReactionKind(kind)) {
    return json({ error: "bad request" }, 400);
  }

  const limiter = await dailyHash(request, env, "limit");
  if (!(await withinBudget(env.DB, `react:${limiter}`, LIMITS.react))) {
    return json({ error: "slow down" }, 429);
  }

  const removed = await env.DB.prepare(
    `DELETE FROM reactions WHERE slug = ?1 AND visitor = ?2 AND kind = ?3`,
  )
    .bind(slug, visitor, kind as ReactionKind)
    .run();

  if (removed.meta.changes === 0) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO reactions (slug, visitor, kind, created_at) VALUES (?1, ?2, ?3, ?4)`,
    )
      .bind(slug, visitor, kind as ReactionKind, Date.now())
      .run();
  }

  return json(await readEngagement(env.DB, slug, visitor));
}

/**
 * GET /api/summary — totals for every post, for the listing pages.
 *
 * The listings need counts for a dozen posts at once, and asking per post would
 * be a dozen requests. This answer is identical for every visitor — no `mine`,
 * no view recorded — which is exactly what makes it cacheable, so a busy home
 * page costs one D1 read a minute rather than one per visit.
 */
async function handleSummary(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const cache = edgeCache();
  const hit = await cache.match(request);
  if (hit) return hit;

  const [views, reactions] = await env.DB.batch([
    env.DB.prepare(`SELECT slug, views FROM post_views`),
    env.DB.prepare(`SELECT slug, kind, COUNT(*) AS n FROM reactions GROUP BY slug, kind`),
  ]);

  const totals: EngagementSummary = {};
  const entry = (slug: string) => (totals[slug] ??= { views: 0, reactions: emptyCounts() });

  for (const row of views.results as { slug: string; views: number }[]) {
    entry(row.slug).views = row.views;
  }
  for (const row of reactions.results as { slug: string; kind: string; n: number }[]) {
    if (isReactionKind(row.kind)) entry(row.slug).reactions[row.kind] = row.n;
  }

  const response = new Response(JSON.stringify(totals), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // A minute stale on a listing is invisible. The post page still fetches
      // its own live numbers, so nothing a reader acts on is ever cached.
      "cache-control": "public, max-age=60",
    },
  });

  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}

// ---------------------------------------------------------------------------

const handler = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    // run_worker_first should mean we only ever see /api/*, but a Worker that
    // silently swallows the site if that config drifts is not worth the risk.
    if (!pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);

    const route = pathname.replace(/\/+$/, "");

    try {
      // Read-only and cacheable, so this one is a GET and skips the write path.
      if (route === "/api/summary") {
        if (request.method !== "GET") return json({ error: "method not allowed" }, 405);
        return await handleSummary(request, env, ctx);
      }

      if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
      if (route === "/api/engagement") return await handleEngagement(request, env);
      if (route === "/api/react") return await handleReact(request, env);
      return json({ error: "not found" }, 404);
    } catch (error) {
      console.error("engagement api failed", error);
      return json({ error: "unavailable" }, 500);
    }
  },

  /**
   * Nightly sweep. Both tables key on hashes that rotate at UTC midnight, so
   * anything stamped with an earlier day is dead weight by definition.
   */
  async scheduled(_controller: unknown, env: Env): Promise<void> {
    const today = utcDay();
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM post_view_visitors WHERE day < ?1`).bind(today),
      env.DB.prepare(`DELETE FROM rate_limit WHERE day < ?1`).bind(today),
    ]);
  },
};

export default handler;
