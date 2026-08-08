import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import PostRow from "@/components/PostRow";
import { getAllTags, getPostSummaries } from "@/lib/posts";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const count = getPostSummaries().filter((p) => p.tags.includes(decoded)).length;

  const title = `Posts tagged “${decoded}”`;
  const description = `${count} ${count === 1 ? "post" : "posts"} tagged ${decoded} on ${site.title}.`;
  const path = `/tags/${encodeURIComponent(decoded)}/`;

  return {
    title,
    description,
    alternates: { canonical: path },
    // Declaring openGraph at all replaces the root layout's block wholesale, so
    // the site card has to be named again — omit it and this page shares with
    // no image at all.
    openGraph: {
      type: "website",
      url: path,
      title,
      description,
      siteName: site.title,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function TagPage({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = getPostSummaries().filter((p) => p.tags.includes(decoded));
  if (posts.length === 0) notFound();

  return (
    <div>
      <header className="border-b border-line pb-8">
        <BackLink href="/tags/">All tags</BackLink>
        <h1 className="mt-5 text-display font-semibold">
          <span className="text-muted">Tagged</span> {decoded}
        </h1>
        <p className="mt-3 text-lede text-muted">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </header>

      <ul className="divide-y divide-line">
        {posts.map((post) => (
          <li key={post.slug}>
            <PostRow post={post} />
          </li>
        ))}
      </ul>
    </div>
  );
}
