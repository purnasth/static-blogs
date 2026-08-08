import type { Metadata } from "next";
import Link from "next/link";
import PostRow from "@/components/PostRow";
import { MetaRow } from "@/components/ui";
import { getAllTags, getPostSummaries } from "@/lib/posts";
import { site } from "@/lib/site";
import type { PostSummary } from "@/lib/types";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** Newest first, so the year headings descend with the list. */
function groupByYear(posts: PostSummary[]): [string, PostSummary[]][] {
  const years = new Map<string, PostSummary[]>();
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), post]);
  }
  return [...years.entries()];
}

export default function Home() {
  const posts = getPostSummaries();
  const tags = getAllTags();
  // getPostSummaries already hides drafts outside development, so this count
  // always matches the number of rows actually on the page.
  const drafts = posts.filter((p) => p.draft).length;

  return (
    <div>
      <section className="border-b border-line pb-10">
        <h1 className="text-balance text-display font-semibold">{site.title}</h1>
        <p className="mt-4 max-w-xl text-pretty text-lede text-muted">{site.description}</p>

        {posts.length > 0 && (
          <MetaRow
            className="mt-6"
            items={[
              <span key="count" className="tabular-nums">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>,
              drafts > 0 && (
                <span
                  key="drafts"
                  className="text-warn"
                  title="Drafts are visible locally and excluded from the built site."
                >
                  {drafts} draft
                </span>
              ),
              <Link key="tags" href="/tags/" className="transition-colors hover:text-accent">
                {tags.length} {tags.length === 1 ? "tag" : "tags"}
              </Link>,
              <a key="rss" href="/rss.xml" className="transition-colors hover:text-accent">
                RSS
              </a>,
            ]}
          />
        )}
      </section>

      {posts.length === 0 ? (
        <p className="py-16 text-muted">
          No posts yet. Run <code className="font-mono text-sm">pnpm write</code> and open{" "}
          <code className="font-mono text-sm">/admin</code> to write your first one.
        </p>
      ) : (
        groupByYear(posts).map(([year, yearPosts]) => (
          <section key={year}>
            <h2
              aria-hidden
              className="veil meta sticky top-16 z-10 -mx-2 px-2 pb-1 pt-6 font-medium tabular-nums"
            >
              {year}
            </h2>
            <ul className="divide-y divide-line">
              {yearPosts.map((post) => (
                <li key={post.slug}>
                  <PostRow post={post} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
