"use client";

import { useEngagement } from "@/components/engagement/EngagementProvider";
import { ReactionGlyphs } from "@/components/engagement/icons";
import RollingCount from "@/components/engagement/RollingCount";
import { REACTION_BAR_ID, REACTIONS } from "@/lib/engagement";

/**
 * "What people made of this", in the post header beside the date.
 *
 * The glyph row itself is `ReactionGlyphs`, shared with the listing rows so the
 * two can't drift — that is also where the outlined-not-filled and
 * not-overlapped reasoning lives.
 *
 * It links down to the real bar, which is the whole reason it can be this
 * terse: it summarises, and the bar is where you act.
 */
export default function ReactionSummary() {
  const { data } = useEngagement();

  const total = REACTIONS.reduce((sum, { kind }) => sum + data.reactions[kind], 0);
  if (total === 0) return null;

  return (
    <a
      href={`#${REACTION_BAR_ID}`}
      className="meta flex items-center gap-2.5 font-italic transition-colors hover:text-accent"
    >
      {/* Carried here rather than handed to MetaRow — see ViewCount. */}
      <span aria-hidden className="scale-150 text-subtle">
        ·
      </span>
      <span className="flex items-center gap-1.5">
        <ReactionGlyphs counts={data.reactions} />
        <RollingCount value={total} />
        <span>{total === 1 ? "reaction" : "reactions"}</span>
      </span>
    </a>
  );
}
