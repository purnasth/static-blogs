import { Heart, Lightbulb, PartyPopper, Rocket, type LucideIcon } from "lucide-react";
import { REACTIONS, type ReactionCounts, type ReactionKind } from "@/lib/engagement";

/**
 * kind -> icon.
 *
 * Lives here rather than in `@/lib/engagement` because that module is also
 * bundled into the Cloudflare Worker, and naming a React component in it would
 * drag the renderer into an edge script.
 */
export const REACTION_ICONS: Record<ReactionKind, LucideIcon> = {
  love: Heart,
  celebrate: PartyPopper,
  insight: Lightbulb,
  inspire: Rocket,
};

/**
 * The little row of icons that says *which* reactions a post got — used by the
 * post header and by every listing row, so the two never drift apart.
 *
 * Outlined, always: fill means "you did this", which is true only in the bar.
 * Only kinds with a count appear, so the row says something specific rather
 * than showing four constant glyphs. They are not overlapped the way a feed
 * stacks avatars — those read overlapped because they are multi-coloured
 * photos, whereas glyphs in a single colour would smear into one shape.
 */
export function ReactionGlyphs({ counts }: { counts: ReactionCounts }) {
  const present = REACTIONS.filter((reaction) => counts[reaction.kind] > 0);
  if (present.length === 0) return null;

  return (
    <span aria-hidden className="flex items-center gap-px">
      {present.map(({ kind }) => {
        const Icon = REACTION_ICONS[kind];
        return <Icon key={kind} className="size-3.5 shrink-0" strokeWidth={1.5} fill="none" />;
      })}
    </span>
  );
}
