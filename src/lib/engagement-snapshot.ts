/**
 * Build-time counts, baked into the static HTML.
 *
 * Without this a post ships with an empty reaction bar that fills in once the
 * browser has called the API — a visible flicker on every page. Reading the
 * totals during `next build` means the numbers are there in the markup, and the
 * live fetch only has to correct them.
 *
 * It is strictly an optimisation. The three environment variables below are
 * optional; unset (the normal case locally) the snapshot is empty and the page
 * simply renders without initial counts. A network or credential failure is
 * logged and swallowed for the same reason — a nicety must never be able to
 * fail a deploy.
 *
 * To enable it, add these to the Cloudflare build settings with an API token
 * scoped to *D1 read* only:
 *   CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN
 */

import { emptyCounts, isReactionKind, type Engagement } from "@/lib/engagement";

type Row = Record<string, unknown>;

let snapshot: Promise<Map<string, Engagement>> | null = null;

async function query(sql: string): Promise<Row[]> {
  const account = process.env.CF_ACCOUNT_ID;
  const database = process.env.CF_D1_DATABASE_ID;
  const token = process.env.CF_API_TOKEN;
  if (!account || !database || !token) return [];

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ sql }),
    },
  );

  if (!response.ok) throw new Error(`D1 replied ${response.status}`);

  const payload = (await response.json()) as { result?: { results?: Row[] }[] };
  return payload.result?.[0]?.results ?? [];
}

async function load(): Promise<Map<string, Engagement>> {
  const counts = new Map<string, Engagement>();

  const entry = (slug: string): Engagement => {
    let existing = counts.get(slug);
    if (!existing) {
      // `mine` is per-visitor and unknowable at build time — always empty here.
      existing = { views: 0, reactions: emptyCounts(), mine: [] };
      counts.set(slug, existing);
    }
    return existing;
  };

  try {
    for (const row of await query(`SELECT slug, views FROM post_views`)) {
      entry(String(row.slug)).views = Number(row.views) || 0;
    }

    for (const row of await query(
      `SELECT slug, kind, COUNT(*) AS n FROM reactions GROUP BY slug, kind`,
    )) {
      const kind = row.kind;
      if (isReactionKind(kind)) entry(String(row.slug)).reactions[kind] = Number(row.n) || 0;
    }
  } catch (error) {
    console.warn(
      `[engagement] build-time snapshot skipped: ${error instanceof Error ? error.message : error}`,
    );
  }

  return counts;
}

/**
 * Counts for one post, or undefined when there are none to bake in. Memoised at
 * module scope so a build with 200 posts still makes exactly two D1 calls.
 */
export async function getEngagementSnapshot(slug: string): Promise<Engagement | undefined> {
  snapshot ??= load();
  return (await snapshot).get(slug);
}
