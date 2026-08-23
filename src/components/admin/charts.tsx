"use client";

import { REACTION_ICONS } from "@/components/engagement/icons";
import { REACTIONS, type ReactionCounts } from "@/lib/engagement";

/**
 * Chart primitives for the writing desk. Dev-only, like everything under
 * `components/admin`.
 *
 * COLOUR — one hue, the site's own accent, used as a sequential ramp. An
 * earlier version gave each reaction kind its own categorical hue; that is the
 * wrong job for this data. Identity here comes from *position* (a labelled
 * column, a labelled point), which leaves colour free to encode magnitude, and
 * a single-hue ramp cannot fail a colour-blindness check the way four
 * competing hues can. It also means the charts inherit the theme rather than
 * fighting it.
 */

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-raised p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 text-title font-semibold tabular-nums">{value}</p>
      {hint && <p className="meta mt-0.5 text-subtle">{hint}</p>}
    </div>
  );
}

export type Point = {
  key: string;
  label: string;
  views: number;
  /** Reactions per 100 views. */
  resonance: number;
  reactions: number;
};

const PAD = { top: 26, right: 26, bottom: 46, left: 54 };
const W = 760;
const H = 430;
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(value));
  return Math.ceil((value * 1.15) / step) * step;
}

/**
 * Both axes count things, so ticks stay whole. Below the tick count that means
 * stepping by one rather than showing "0.8 views", which is not a quantity.
 */
function ticks(max: number, count = 4): number[] {
  if (max <= count) {
    return Array.from({ length: Math.max(2, Math.round(max) + 1) }, (_, i) => i);
  }
  return Array.from({ length: count + 1 }, (_, i) => Math.round((max / count) * i));
}

/**
 * Reach against resonance — the one chart that says something the numbers
 * cannot say on their own.
 *
 * x is how many people arrived, y is what share of them cared enough to press
 * something. The crosshair sits at the blog's own averages, so the quadrants
 * are read relative to your writing rather than some outside benchmark. The
 * interesting corner is top-left: posts almost nobody found, that the people
 * who did found worth reacting to.
 *
 * Deliberately not two bar charts. Reach and resonance are different scales,
 * and the point is the *relationship* between them — which is a position, not
 * two lengths.
 */
export function ReachResonance({
  points,
  avgViews,
  avgResonance,
}: {
  points: Point[];
  avgViews: number;
  avgResonance: number;
}) {
  const xMax = niceMax(Math.max(...points.map((p) => p.views), avgViews));
  const yMax = niceMax(Math.max(...points.map((p) => p.resonance), avgResonance));

  const x = (v: number) => PAD.left + (v / xMax) * PLOT_W;
  const y = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H;

  const cx = x(avgViews);
  const cy = y(avgResonance);

  const QUADRANTS = [
    { label: "Hidden gems", at: [PAD.left + 8, PAD.top + 14], anchor: "start" },
    { label: "Hits", at: [W - PAD.right - 8, PAD.top + 14], anchor: "end" },
    { label: "Quiet", at: [PAD.left + 8, H - PAD.bottom - 8], anchor: "start" },
    { label: "Passed through", at: [W - PAD.right - 8, H - PAD.bottom - 8], anchor: "end" },
  ] as const;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Each post plotted by total views against reactions per 100 views."
      >
        {/* Recessive grid — present enough to read a value off, quiet enough to
            stay behind the marks. */}
        {ticks(yMax).map((t) => (
          <g key={`y${t}`}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--line)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 10}
              y={y(t) + 4}
              textAnchor="end"
              className="fill-[var(--fg-subtle)] text-xxs tabular-nums"
            >
              {t}
            </text>
          </g>
        ))}
        {ticks(xMax).map((t) => (
          <text
            key={`x${t}`}
            x={x(t)}
            y={H - PAD.bottom + 20}
            textAnchor="middle"
            className="fill-[var(--fg-subtle)] text-xxs tabular-nums"
          >
            {t}
          </text>
        ))}

        {/* The averages. Dashed so they read as reference, not as data. */}
        <line
          x1={cx}
          x2={cx}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="var(--line-strong)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={cy}
          y2={cy}
          stroke="var(--line-strong)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        {QUADRANTS.map((q) => (
          <text
            key={q.label}
            x={q.at[0]}
            y={q.at[1]}
            textAnchor={q.anchor}
            className="fill-[var(--fg-subtle)] text-[8px] font-italic uppercase tracking-wide"
          >
            {q.label}
          </text>
        ))}

        {points.map((p) => (
          <g key={p.key}>
            <title>{`${p.label} — ${p.views} views, ${p.reactions} reactions, ${Math.round(p.resonance)} per 100`}</title>
            {/* Invisible, generous hit area: a 12px dot is not a hit target. */}
            <circle cx={x(p.views)} cy={y(p.resonance)} r="15" fill="transparent" />
            <circle
              cx={x(p.views)}
              cy={y(p.resonance)}
              r="6"
              fill="var(--accent)"
              // A surface ring keeps overlapping posts separable.
              stroke="var(--bg-raised)"
              strokeWidth="2"
            />
            <text
              x={x(p.views)}
              y={y(p.resonance) - 14}
              textAnchor="middle"
              className="fill-[var(--fg-muted)] text-xxs"
            >
              {p.label.length > 26 ? `${p.label.slice(0, 25)}…` : p.label}
            </text>
          </g>
        ))}

        <text
          x={PAD.left + PLOT_W / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-[var(--fg-subtle)] text-xxs font-italic"
        >
          Views →
        </text>
        <text
          transform={`rotate(-90 14 ${PAD.top + PLOT_H / 2})`}
          x={14}
          y={PAD.top + PLOT_H / 2}
          textAnchor="middle"
          className="fill-[var(--fg-subtle)] text-xxs font-italic"
        >
          Reactions per 100 views →
        </text>
      </svg>
      <figcaption className="text-xs text-center mt-6 text-subtle font-italic">
        Dashed lines are this blog&rsquo;s own averages. Top-left is the corner worth
        acting on: posts few people found, that the ones who did responded to.
      </figcaption>
    </figure>
  );
}

export type HeatRow = { key: string; label: string; counts: ReactionCounts };

/**
 * Which reactions each post drew — a grid rather than a stacked bar.
 *
 * A stack answers "how many altogether" and makes the individual kinds hard to
 * compare across posts, because each segment starts at a different offset. A
 * grid puts every post's "Learned something" in one column, so the shape of a
 * post's response reads down a column and across a row at once.
 */
export function ReactionHeatmap({ rows }: { rows: HeatRow[] }) {
  const max = Math.max(...rows.flatMap((r) => REACTIONS.map(({ kind }) => r.counts[kind])), 1);

  return (
    <figure className="m-0 overflow-x-auto">
      <table className="w-full min-w-[30rem] border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="w-2/5" />
            {REACTIONS.map(({ kind, label }) => {
              const Icon = REACTION_ICONS[kind];
              return (
                <th key={kind} scope="col" className="pb-1.5 align-bottom">
                  <span className="flex flex-col items-center gap-1">
                    <Icon aria-hidden className="size-4 text-muted" strokeWidth={1.5} />
                    <span className="meta text-subtle">{label}</span>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="truncate pr-3 text-left text-sm font-normal">
                {row.label}
              </th>
              {REACTIONS.map(({ kind, label }) => {
                const count = row.counts[kind];
                // Sequential ramp between the empty surface and the accent, with
                // a floor so "one" never looks like "none".
                const pct = count === 0 ? 0 : Math.round(20 + (count / max) * 80);
                return (
                  <td
                    key={kind}
                    title={`${row.label} — ${label}: ${count}`}
                    className="h-10 rounded-md text-center text-sm tabular-nums"
                    style={{
                      background: `color-mix(in oklab, var(--accent) ${pct}%, var(--bg-inset))`,
                      color: pct > 55 ? "var(--accent-contrast)" : "var(--fg)",
                    }}
                  >
                    {count || ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="meta mt-2 flex items-center gap-2 text-subtle">
        Fewer
        <span className="flex gap-0.5">
          {[0, 20, 40, 60, 80, 100].map((pct) => (
            <span
              key={pct}
              aria-hidden
              className="size-3 rounded-sm"
              style={{ background: `color-mix(in oklab, var(--accent) ${pct}%, var(--bg-inset))` }}
            />
          ))}
        </span>
        More
      </figcaption>
    </figure>
  );
}
