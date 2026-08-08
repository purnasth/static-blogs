import type { Metadata } from "next";
import TagChip from "@/components/TagChip";
import { getAllTags } from "@/lib/posts";
import { site } from "@/lib/site";

const DESCRIPTION = `Every topic written about on ${site.title}, with a count of the posts under each.`;

export const metadata: Metadata = {
  title: "Tags",
  description: DESCRIPTION,
  alternates: { canonical: "/tags/" },
  // Declaring openGraph at all replaces the root layout's block wholesale, so
  // the site card has to be named again — omit it and this page shares with no
  // image at all.
  openGraph: {
    type: "website",
    url: "/tags/",
    title: "Tags",
    description: DESCRIPTION,
    siteName: site.title,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tags",
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div>
      <header className="border-b border-line pb-8">
        <h1 className="text-display font-semibold">Tags</h1>
        <p className="mt-3 text-lede text-muted">
          {tags.length === 0
            ? "Nothing tagged yet."
            : `${tags.length} ${tags.length === 1 ? "tag" : "tags"} across the archive, most used first.`}
        </p>
      </header>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-8">
          {tags.map(({ tag, count }) => (
            <TagChip key={tag} tag={tag} count={count} size="md" />
          ))}
        </div>
      )}
    </div>
  );
}
