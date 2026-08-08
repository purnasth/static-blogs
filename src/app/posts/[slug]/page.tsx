import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import TagChip from "@/components/TagChip";
import { Badge, LinkList, LinkRow, MetaRow } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import {
  getAdjacentPosts,
  getAllPosts,
  getPost,
  getReadingTime,
  getRelatedPosts,
} from "@/lib/posts";
import { site } from "@/lib/site";
import type { PostSummary } from "@/lib/types";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/posts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const path = `/posts/${post.slug}/`;
  // Named explicitly rather than left to the opengraph-image file convention,
  // which can only attach one hard-coded alt to every post's card. The image is
  // still the generated one — this just describes it per post.
  const card = {
    url: `${path}opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${post.title} — ${site.title}`,
  };

  return {
    title: post.title,
    description: post.summary,
    // The one URL this post should rank as, however it was reached.
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      // The bare headline, not the templated "… — Purna Shrestha": og:site_name
      // already carries the brand, and share cards read better without it.
      title: post.title,
      description: post.summary,
      siteName: site.title,
      publishedTime: post.date,
      authors: [site.author],
      tags: post.tags,
      images: [card],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [card],
    },
    // Drafts never reach a production build, but they are reachable while
    // writing — this keeps one out of an index if it is ever served.
    ...(post.draft ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { html, headings } = await renderMarkdown(post.body);
  const { newer, older } = getAdjacentPosts(slug);
  const related = getRelatedPosts(slug, post.tags);

  return (
    <div className="relative">
      <ReadingProgress />

      {/* Parked outside the reading column; only enough room for it at xl. */}
      <div className="absolute left-full top-0 hidden h-full pl-10 xl:block">
        <TableOfContents headings={headings} />
      </div>

      <article>
        <header className="mb-10">
          <BackLink href="/">All posts</BackLink>

          <h1 className="mt-5 text-balance text-display font-semibold">{post.title}</h1>

          {post.summary && <p className="mt-4 text-pretty text-lede text-muted">{post.summary}</p>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-4">
            <MetaRow
              items={[
                <time key="date" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>,
                getReadingTime(post.body),
                post.draft && (
                  <Badge key="draft" tone="warn">
                    draft
                  </Badge>
                ),
              ]}
            />
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            )}
          </div>
        </header>

        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            // Describes what the image illustrates, for screen readers and for
            // image search — an empty alt forfeits both.
            alt={`Cover image for “${post.title}”`}
            className="mb-10 w-full rounded-xl border border-line"
          />
        )}

        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </article>

      {(newer || older) && (
        <nav
          aria-label="More posts"
          className="mt-16 grid gap-3 border-t border-line pt-8 sm:grid-cols-2"
        >
          <AdjacentLink post={older} direction="older" />
          <AdjacentLink post={newer} direction="newer" />
        </nav>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="eyebrow mb-4">Related reading</h2>
          <LinkList>
            {related.map((item) => (
              <li key={item.slug}>
                <LinkRow
                  href={`/posts/${item.slug}/`}
                  label={item.title}
                  aside={item.readingTime}
                />
              </li>
            ))}
          </LinkList>
        </section>
      )}
    </div>
  );
}

function AdjacentLink({
  post,
  direction,
}: {
  post: PostSummary | null;
  direction: "older" | "newer";
}) {
  const newer = direction === "newer";

  // Keeps the two-column grid balanced when a post is first or last.
  if (!post) return <div className="hidden sm:block" />;

  return (
    <Link
      href={`/posts/${post.slug}/`}
      rel={newer ? "next" : "prev"}
      className={`group rounded-lg border border-line bg-raised p-3 transition-colors hover:border-line-strong ${
        newer ? "sm:text-right" : ""
      }`}
    >
      <span className="meta block text-subtle text-xs">{newer ? "Newer →" : "← Older"}</span>
      <span className="mt-1 block font-medium leading-snug transition-colors group-hover:text-accent text-sm">
        {post.title}
      </span>
    </Link>
  );
}
