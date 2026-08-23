"use client";

import { useEffect, useState } from "react";
import {
  ReachResonance,
  ReactionHeatmap,
  StatTile,
  type HeatRow,
  type Point,
} from "@/components/admin/charts";
import { Notice, Panel, PanelHeader } from "@/components/ui";
import { NoticeKind } from "@/lib/enums";
import { emptyCounts, isReactionKind, REACTIONS, type ReactionCounts } from "@/lib/engagement";

/**
 * Dev-only: production engagement, for deciding what to write next.
 *
 * The three views answer three different questions and deliberately do not
 * share an axis: reach (who arrived), mix (what they felt), and resonance
 * (what share of arrivals cared enough to press something). Reach and
 * resonance are different scales — plotting them together would be a
 * dual-axis chart, which is the fastest way to make a chart lie.
 */

type Row = { slug: string; kind: string; n: number };
type Stats = { ok: boolean; rows?: Row[]; error?: string };

export type PostRef = { slug: string; title: string; draft: boolean };

type Aggregate = {
  slug: string;
  title: string;
  views: number;
  counts: ReactionCounts;
  reactions: number;
  /** Reactions per 100 views. Null when nobody has arrived yet. */
  resonance: number | null;
};

function aggregate(rows: Row[], posts: PostRef[]): Aggregate[] {
  const byslug = new Map<string, Aggregate>();
  const entry = (slug: string) => {
    let found = byslug.get(slug);
    if (!found) {
      found = {
        slug,
        title: posts.find((p) => p.slug === slug)?.title ?? slug,
        views: 0,
        counts: emptyCounts(),
        reactions: 0,
        resonance: null,
      };
      byslug.set(slug, found);
    }
    return found;
  };

  for (const row of rows) {
    if (row.kind === "view") entry(row.slug).views = row.n;
    else if (isReactionKind(row.kind)) entry(row.slug).counts[row.kind] = row.n;
  }

  for (const item of byslug.values()) {
    item.reactions = REACTIONS.reduce((sum, { kind }) => sum + item.counts[kind], 0);
    item.resonance = item.views > 0 ? (item.reactions / item.views) * 100 : null;
  }

  return [...byslug.values()];
}

export default function StatsDashboard({ posts }: { posts: PostRef[] }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats/")
      .then((response) => response.json())
      .then(setStats)
      .catch((error: Error) => setStats({ ok: false, error: error.message }));
  }, []);

  if (!stats) {
    return (
      <Panel className="px-5 py-4">
        <p className="meta text-muted">Reading production…</p>
      </Panel>
    );
  }

  if (!stats.ok) {
    return (
      <Notice
        notice={{
          kind: NoticeKind.Error,
          text: `Could not read the database — check \`npx wrangler whoami\` and that database_id in wrangler.jsonc is filled in. ${stats.error ?? ""}`,
        }}
      />
    );
  }

  const data = aggregate(stats.rows ?? [], posts);
  const totalViews = data.reduce((sum, d) => sum + d.views, 0);
  const totalReactions = data.reduce((sum, d) => sum + d.reactions, 0);
  const rate = totalViews > 0 ? (totalReactions / totalViews) * 100 : null;

  // Every post that anyone actually reached. Resonance needs arrivals to
  // divide by, so a post with no views has no position on this plot.
  const points: Point[] = data
    .filter((d) => d.views > 0)
    .map((d) => ({
      key: d.slug,
      label: d.title,
      views: d.views,
      resonance: d.resonance ?? 0,
      reactions: d.reactions,
    }));

  const avgViews = points.length > 0 ? totalViews / points.length : 0;

  const heat: HeatRow[] = [...data]
    .filter((d) => d.reactions > 0)
    .sort((a, b) => b.reactions - a.reactions)
    .map((d) => ({ key: d.slug, label: d.title, counts: d.counts }));

  return (
    <div className="flex flex-col gap-6">

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Views" value={totalViews.toLocaleString("en-US")} />
        <StatTile label="Reactions" value={totalReactions.toLocaleString("en-US")} />
        {/* Not a percentage: one reader can leave all four reactions, so this
            legitimately exceeds 100 and a "%" would be a lie. */}
        <StatTile
          label="Resonance"
          value={rate === null ? "—" : String(Math.round(rate))}
          hint="reactions per 100 views"
        />
        <StatTile label="Posts live" value={String(posts.filter((p) => !p.draft).length)} />
      </div>

      {totalViews === 0 && totalReactions === 0 ? (
        <Notice
          notice={{
            kind: NoticeKind.Info,
            text: "Nothing recorded yet. These fill in as people read and react — deliberately empty rather than drawing shapes out of two data points.",
          }}
        />
      ) : (
        <>
          <Panel>
            <PanelHeader
              title="Reach vs. resonance"
              description="Who arrived, against how many of them responded"
            />
            <div className="px-5 py-4">
              {points.length > 0 ? (
                <ReachResonance
                  points={points}
                  avgViews={avgViews}
                  avgResonance={rate ?? 0}
                />
              ) : (
                <p className="meta text-muted">No views recorded yet.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Reaction fingerprint"
              description="Which kind of response each post drew"
            />
            <div className="px-5 py-4">
              {heat.length > 0 ? (
                <ReactionHeatmap rows={heat} />
              ) : (
                <p className="meta text-muted">No reactions yet.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Every number" description="The same data, exactly" />
            <div className="overflow-x-auto px-5 pt-2 pb-1">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="eyebrow py-2 pr-3 font-medium">Post</th>
                    <th className="eyebrow py-2 pr-3 text-right font-medium">Views</th>
                    {REACTIONS.map(({ kind, label }) => (
                      <th key={kind} className="eyebrow py-2 pr-3 text-right font-medium">
                        {label}
                      </th>
                    ))}
                    <th className="eyebrow py-2 text-right font-medium">Per 100</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data]
                    .sort((a, b) => b.views - a.views)
                    .map((d, index) => (
                      <tr key={d.slug} className={`border-b border-line/60 ${index === data.length - 1 ? "border-b-0" : ""}`}>
                        <td className="py-2 pr-3">{d.title}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{d.views}</td>
                        {REACTIONS.map(({ kind }) => (
                          <td key={kind} className="py-2 pr-3 text-right tabular-nums text-muted">
                            {d.counts[kind] || "—"}
                          </td>
                        ))}
                        <td className="py-2 text-right tabular-nums">
                          {d.resonance === null ? "—" : Math.round(d.resonance)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
