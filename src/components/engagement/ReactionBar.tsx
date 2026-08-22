"use client";

import { useEffect, useState } from "react";
import { useEngagement } from "@/components/engagement/EngagementProvider";
import { REACTION_ICONS } from "@/components/engagement/icons";
import RollingCount from "@/components/engagement/RollingCount";
import {
  REACTION_BAR_ID,
  REACTIONS,
  STICKY_REACTIONS_AT,
  type ReactionKind,
} from "@/lib/engagement";

function ReactionButton({ kind, label, compact }: { kind: ReactionKind; label: string; compact?: boolean }) {
  const { data, failed, toggle } = useEngagement();
  const [popping, setPopping] = useState(false);

  const held = data.mine.includes(kind);
  const count = data.reactions[kind];
  const Icon = REACTION_ICONS[kind];

  return (
    <button
      type="button"
      onClick={() => {
        toggle(kind);
        setPopping(true);
      }}
      onAnimationEnd={() => setPopping(false)}
      disabled={failed}
      aria-pressed={held}
      aria-label={count > 0 ? `${label} — ${count} so far` : label}
      title={label}
      className={`inline-flex items-center rounded-full text-meta transition-colors disabled:pointer-events-none disabled:opacity-40 ${
        // The floating bar's container already supplies the chrome, so its
        // buttons drop their own border — a pill inside a pill reads as noise
        // at that size.
        compact
          ? `gap-1 px-2 py-2 ${
              held
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-inset hover:text-foreground"
            }`
          : `gap-1.5 border px-3 py-1.5 ${
              held
                ? "border-accent-line bg-accent-soft text-accent"
                : "border-line bg-raised text-muted hover:border-line-strong hover:text-foreground"
            }`
      }`}
    >
      <Icon
        aria-hidden
        className={`size-4 shrink-0 ${popping ? "reaction-pop" : ""}`}
        strokeWidth={1.5}
        fill={held ? "currentColor" : "none"}
      />
      {!compact && <span>{label}</span>}
      {count > 0 && <RollingCount value={count} className="text-subtle" />}
    </button>
  );
}

/** The real bar, at the end of the article. */
export default function ReactionBar() {
  const { failed } = useEngagement();
  if (failed) return null;

  return (
    <section
      id={REACTION_BAR_ID}
      aria-label="Reactions"
      // scroll-mt clears the sticky header when the header summary links here.
      className="mt-16 scroll-mt-24 border-t border-line pt-6"
    >
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(({ kind, label }) => (
          <ReactionButton key={kind} kind={kind} label={label} />
        ))}
      </div>
    </section>
  );
}

/**
 * The floating bar. Appears once the reader is past `STICKY_REACTIONS_AT` and
 * the real bar is still below the fold — reactions parked at the very bottom
 * only ever reach people who finish, and it would be silly to show both.
 */
export function StickyReactionBar() {
  const { failed } = useEngagement();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let deepEnough = false;
    let barOnScreen = false;
    let frame = 0;

    const sync = () => setShown(deepEnough && !barOnScreen);

    // Mirrors ReadingProgress's rAF throttle rather than measuring per event.
    function measure() {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      deepEnough = scrollable > 0 && window.scrollY / scrollable > STICKY_REACTIONS_AT;
      sync();
    }

    function onScroll() {
      if (frame === 0) frame = requestAnimationFrame(measure);
    }

    const anchor = document.getElementById(REACTION_BAR_ID);
    const observer = new IntersectionObserver(([entry]) => {
      barOnScreen = entry.isIntersecting;
      sync();
    });
    if (anchor) observer.observe(anchor);

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (failed) return null;

  return (
    <div
      // aria-hidden: it is a duplicate of the real bar, which stays in the tree.
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 transition-all duration-200 ease-out ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <div className="veil flex items-center gap-1 rounded-full border border-line p-1 shadow-lg">
        {REACTIONS.map(({ kind, label }) => (
          <ReactionButton key={kind} kind={kind} label={label} compact />
        ))}
      </div>
    </div>
  );
}
