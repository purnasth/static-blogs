"use client";

import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "@/components/engagement/summaryStore";
import FeaturedPost from "@/components/FeaturedPost";
import { REACTIONS } from "@/lib/engagement";
import type { PostSummary } from "@/lib/types";

/**
 * The lead card: the most-reacted post, or the newest when nothing has been
 * reacted to yet.
 *
 * It reads the same `/api/summary` the listing rows already fetch, so this
 * costs no extra request. An earlier attempt did the sort at build time, which
 * dragged in a Cloudflare API token and three build variables to reorder one
 * card — all of that was self-inflicted by insisting the answer be known before
 * the page was served.
 *
 * The trade it accepts: on a first visit the card can change once, a moment
 * after load. There is no layout shift — `FeaturedPost` has a fixed
 * min-height — but the cover image does swap, which costs one extra image
 * download and makes the measured LCP describe an image the reader no longer
 * sees. On repeat visits the summary is already cached and the card is right
 * immediately.
 *
 * The server render and the first client render both see an empty summary, so
 * both produce the newest post: no hydration mismatch, and "newest" is the
 * fallback for free rather than a special case.
 */
export default function FeaturedSlot({ posts }: { posts: PostSummary[] }) {
  const summary = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (posts.length === 0) return null;

  const reactionsFor = (slug: string) => {
    const counts = summary[slug]?.reactions;
    return counts ? REACTIONS.reduce((sum, { kind }) => sum + counts[kind], 0) : 0;
  };

  // `posts` is newest-first and sort is stable, so ties keep that order.
  const featured = [...posts].sort((a, b) => reactionsFor(b.slug) - reactionsFor(a.slug))[0];

  return (
    <FeaturedPost
      post={featured}
      label={reactionsFor(featured.slug) > 0 ? "Most popular" : "Latest post"}
    />
  );
}
