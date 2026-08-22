import Link from "next/link";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import EngagementProvider from "@/components/engagement/EngagementProvider";
import ReactionBar, { StickyReactionBar } from "@/components/engagement/ReactionBar";
import ReactionSummary from "@/components/engagement/ReactionSummary";
import ViewCount from "@/components/engagement/ViewCount";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import TagChip from "@/components/TagChip";
import { Badge, LinkList, LinkRow, MetaRow } from "@/components/ui";
import { getEngagementSnapshot } from "@/lib/engagement-snapshot";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import {
  getAdjacentPosts,
  getAllPosts,
  getPost,
  getReadingTime,
  getRelatedPosts,
} from "@/lib/posts";
import type { PostSummary } from "@/lib/types";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { html, headings } = await renderMarkdown(post.body);
  const { newer, older } = getAdjacentPosts(slug);
  const related = getRelatedPosts(slug, post.tags);
  const engagement = await getEngagementSnapshot(slug);

  return (
    <EngagementProvider slug={slug} initial={engagement}>
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

            {post.summary && (
              <p className="mt-4 text-pretty text-lede text-muted">{post.summary}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
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
                <ViewCount />
                <ReactionSummary />
              </div>
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
            <img src={post.cover} alt="" className="mb-10 w-full rounded-xl border border-line" />
          )}

          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        <ReactionBar />
        <StickyReactionBar />

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
    </EngagementProvider>
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
