"use client";

import { useEffect, useRef, useState } from "react";
import {
  ENGAGEMENT_ENDPOINT,
  emptyEngagement,
  formatCount,
  getVisitorId,
  REACT_ENDPOINT,
  REACTIONS,
  type Engagement,
  type ReactionKind,
} from "@/lib/engagement";

type Props = {
  slug: string;
  /**
   * Counts baked in at build time. They render in the static HTML, so the bar
   * arrives with real numbers and holds its height — the live figures replace
   * them a moment later without moving anything.
   */
  initial?: Engagement;
};

export default function PostEngagement({ slug, initial }: Props) {
  const [data, setData] = useState<Engagement>(initial ?? emptyEngagement());
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const visitorRef = useRef<string>("");

  // Registers the view and pulls this visitor's own reactions in one request.
  useEffect(() => {
    let cancelled = false;
    visitorRef.current = getVisitorId();

    fetch(ENGAGEMENT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, visitor: visitorRef.current }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((fresh: Engagement) => {
        if (cancelled) return;
        setData(fresh);
        setLive(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggle(kind: ReactionKind) {
    const held = data.mine.includes(kind);

    // Optimistic: the button answers the click, then the server confirms.
    setData((current) => ({
      ...current,
      reactions: {
        ...current.reactions,
        [kind]: Math.max(0, current.reactions[kind] + (held ? -1 : 1)),
      },
      mine: held ? current.mine.filter((k) => k !== kind) : [...current.mine, kind],
    }));

    try {
      const response = await fetch(REACT_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, visitor: visitorRef.current, kind }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setData((await response.json()) as Engagement);
    } catch {
      // Roll the optimistic edit back rather than leave a count that lies.
      setData((current) => ({
        ...current,
        reactions: {
          ...current.reactions,
          [kind]: Math.max(0, current.reactions[kind] + (held ? 1 : -1)),
        },
        mine: held ? [...current.mine, kind] : current.mine.filter((k) => k !== kind),
      }));
    }
  }

  // Nothing to show and no way to get it — say nothing rather than show zeroes.
  if (failed && !initial) return null;

  return (
    <section
      aria-label="Reactions"
      className="mt-16 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-6"
    >
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(({ kind, emoji, label }) => {
          const held = data.mine.includes(kind);
          const count = data.reactions[kind];

          return (
            <button
              key={kind}
              type="button"
              onClick={() => toggle(kind)}
              disabled={failed}
              aria-pressed={held}
              title={label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-meta transition-colors disabled:opacity-50 ${
                held
                  ? "border-accent-line bg-accent-soft text-accent"
                  : "border-line bg-raised text-muted hover:border-line-strong hover:text-foreground"
              }`}
            >
              <span aria-hidden>{emoji}</span>
              <span>{label}</span>
              {count > 0 && (
                <span className="tabular-nums text-subtle">{formatCount(count)}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="meta font-italic text-subtle tabular-nums" aria-live="polite">
        {/* Held back until the real number lands, so a stale build-time
            snapshot never gets presented as today's count. */}
        {live || initial ? `${formatCount(data.views)} views` : " "}
      </p>
    </section>
  );
}
