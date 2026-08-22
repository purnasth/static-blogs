"use client";

import { Eye } from "lucide-react";
import { useSyncExternalStore } from "react";
import { ReactionGlyphs } from "@/components/engagement/icons";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "@/components/engagement/summaryStore";
import { formatCount, REACTIONS } from "@/lib/engagement";

/**
 * Views and reactions for one post, for the listing rows.
 *
 * Renders as dot-separated siblings of `MetaRow` rather than as items inside
 * it, because MetaRow drops falsy *items* and this is a truthy element even on
 * the renders where it shows nothing — inside MetaRow it would leave dots
 * hanging off the end of the line.
 */

type Variant = "meta" | "overlay";

const TONE: Record<Variant, { text: string; dot: string }> = {
  meta: { text: "meta font-italic", dot: "text-subtle" },
  // On the featured card the type sits on a darkened photo, never on the page.
  overlay: { text: "font-italic text-micro text-white/55", dot: "text-white/30" },
};

/** Hoisted: defining this inside the render would remount it on every pass. */
function Item({ tone, children }: { tone: (typeof TONE)[Variant]; children: React.ReactNode }) {
  return (
    <span className={`flex items-center gap-2.5 ${tone.text}`}>
      <span aria-hidden className={`scale-150 ${tone.dot}`}>
        ·
      </span>
      <span className="flex items-center gap-1.5 tabular-nums">{children}</span>
    </span>
  );
}

export default function PostStats({
  slug,
  variant = "meta",
}: {
  slug: string;
  variant?: Variant;
}) {
  const summary = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const totals = summary[slug];
  if (!totals) return null;

  const reactions = REACTIONS.reduce((sum, { kind }) => sum + totals.reactions[kind], 0);
  if (totals.views === 0 && reactions === 0) return null;

  const tone = TONE[variant];

  return (
    <>
      {totals.views > 0 && (
        <Item tone={tone}>
          <Eye aria-hidden className="size-3.5 shrink-0" strokeWidth={1.5} />
          {formatCount(totals.views)}
          <span className="sr-only">views</span>
        </Item>
      )}
      {reactions > 0 && (
        <Item tone={tone}>
          <ReactionGlyphs counts={totals.reactions} />
          {formatCount(reactions)}
          <span className="sr-only">reactions</span>
        </Item>
      )}
    </>
  );
}
