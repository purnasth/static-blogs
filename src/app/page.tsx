import Link from "next/link";
import { Fragment } from "react";
import FeaturedSlot from "@/components/engagement/FeaturedSlot";
import Hero from "@/components/Hero";
import PostRow from "@/components/PostRow";
import { getAllTags, getPostSummaries } from "@/lib/posts";
import { site } from "@/lib/site";
import type { PostSummary } from "@/lib/types";

const NAMED_TOPICS = 3;

/** Newest first, so the year headings descend with the list. */
function groupByYear(posts: PostSummary[]): [string, PostSummary[]][] {
  const years = new Map<string, PostSummary[]>();
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), post]);
  }
  return [...years.entries()];
}

/** Adds up the per-post estimates already on each summary, e.g. "7 min read". */
function totalReadingMinutes(posts: PostSummary[]): number {
  return posts.reduce(
    (minutes, post) =>
      minutes + (Number(post.readingTime.match(/\d+/)?.[0]) || 0),
    0,
  );
}

export default function Home() {
  const posts = getPostSummaries();
  const tags = getAllTags();
  // getPostSummaries already hides drafts outside development, so this count
  // always matches the number of rows actually on the page.
  const drafts = posts.filter((p) => p.draft).length;

  // Only the pill uses this now — it genuinely means "newest", while the card
  // below leads on reactions. The two say different things on purpose.
  const [latest] = posts;
  const since = posts.at(-1)?.date.slice(0, 4);
  const minutes = totalReadingMinutes(posts);
  const named = tags.slice(0, NAMED_TOPICS);
  const unnamed = tags.length - named.length;

  return (
    <div>
      <Hero
        eyebrow={
          latest ? `Latest — ${latest.title}` : "A quiet corner, for now"
        }
        eyebrowHref={latest ? `/posts/${latest.slug}/` : undefined}
        live={Boolean(latest)}
        aurora
        lede={site.intro}
      >
        <FeaturedSlot posts={posts} />
      </Hero>

      {named.length > 0 && (
        <section className="mt-16 flex flex-col gap-x-8 gap-y-3 sm:flex-row">
          <h2 className="eyebrow shrink-0 pt-1.5 sm:w-44">What I write about</h2>
          <p className="max-w-xl text-pretty text-muted">
            Mostly{" "}
            {named.map(({ tag }, index) => (
              <Fragment key={tag}>
                {index > 0 && (index === named.length - 1 ? " and " : ", ")}
                <Link
                  href={`/tags/${encodeURIComponent(tag)}/`}
                  className="text-foreground underline decoration-accent-line underline-offset-[0.18em] transition-colors hover:decoration-accent"
                >
                  {tag}
                </Link>
              </Fragment>
            ))}
            {unnamed > 0 && (
              <>
                , with side trips into{" "}
                <Link
                  href="/tags/"
                  className="text-foreground underline decoration-accent-line underline-offset-[0.18em] transition-colors hover:decoration-accent"
                >
                  {unnamed} more {unnamed === 1 ? "topic" : "topics"}
                </Link>
              </>
            )}
            .{" "}
            {posts.length > 0 && (
              <span className="text-subtle">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
                {since && ` since ${since}`}
                {minutes > 0 && `, about ${minutes} minutes of reading`}
                {" — or take the "}
                <a
                  href="/rss.xml"
                  className="underline decoration-accent-line underline-offset-[0.18em] transition-colors hover:decoration-accent"
                >
                  feed
                </a>
                .
              </span>
            )}
          </p>
        </section>
      )}

      {posts.length === 0 && (
        <p className="py-16 text-muted">
          No posts yet. Run <code className="font-mono text-sm">pnpm write</code>{" "}
          and open <code className="font-mono text-sm">/admin</code> to write
          your first one.
        </p>
      )}

      {posts.length > 0 && (
        <>
          <div className="mt-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line pb-3">
            <h2 className="eyebrow">All posts</h2>
            {drafts > 0 && (
              <p
                className="meta text-warn"
                title="Drafts are visible locally and excluded from the built site."
              >
                {drafts} draft
              </p>
            )}
          </div>

          {groupByYear(posts).map(
            ([year, yearPosts]) => (
              <section key={year}>
                <h3
                  aria-hidden
                  className="veil meta sticky top-24 z-10 -mx-2 px-2 pb-1 pt-6 font-medium tabular-nums sm:top-16"
                >
                  {year}
                </h3>
                <ul className="divide-y divide-line">
                  {yearPosts.map((post) => (
                    <li key={post.slug}>
                      <PostRow post={post} />
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </>
      )}
    </div>
  );
}
