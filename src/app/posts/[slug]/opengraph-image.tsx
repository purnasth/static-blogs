import { ImageResponse } from "next/og";
import {
  SHARE_CARD_CONTENT_TYPE,
  SHARE_CARD_SIZE,
  ShareCard,
  loadCoverArt,
} from "@/lib/share-card";
import { formatDate } from "@/lib/format";
import { getAllPosts, getPost, getReadingTime } from "@/lib/posts";
import { site } from "@/lib/site";

export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_CONTENT_TYPE;
export const alt = `A post on ${site.title}`;

/**
 * Without this the card is only built for routes Next happens to prerender, and
 * `output: "export"` leaves the rest of the posts pointing at a URL that does
 * not exist in `out/`.
 */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return new ImageResponse(<ShareCard eyebrow={site.title} title={site.title} />, size);
  }

  return new ImageResponse(
    (
      <ShareCard
        eyebrow={site.title}
        aside={formatDate(post.date)}
        title={post.title}
        description={post.summary}
        art={await loadCoverArt(post.cover)}
        footerLeft={post.tags.map((tag) => `#${tag}`).join("  ")}
        footerRight={getReadingTime(post.body)}
      />
    ),
    size,
  );
}
