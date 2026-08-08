import { ImageResponse } from "next/og";
import { SHARE_CARD_CONTENT_TYPE, SHARE_CARD_SIZE, ShareCard } from "@/lib/share-card";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_CONTENT_TYPE;
export const alt = site.title;

// The card takes no route parameters, so nothing else tells Next this is a
// build-time asset — without it, `output: "export"` treats it as a dynamic
// handler and refuses to export the site.
export const dynamic = "force-static";

/**
 * The site-wide card. Metadata files cascade, so every route without one of its
 * own — /about/, /tags/, a tag page, the 404 — shares this image.
 */
export default function Image() {
  const posts = getAllPosts().length;

  return new ImageResponse(
    (
      <ShareCard
        eyebrow={site.title}
        title={site.homeTitle.replace(`${site.title} — `, "")}
        description={site.metaDescription}
        footerLeft={site.url.replace(/^https?:\/\//, "")}
        footerRight={`${posts} ${posts === 1 ? "post" : "posts"}`}
      />
    ),
    size,
  );
}
