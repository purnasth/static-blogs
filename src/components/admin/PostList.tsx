"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PublishPanel from "@/components/admin/PublishPanel";
import {
  ButtonLink,
  Input,
  MetaRow,
  Panel,
  SegmentedControl,
  StatusBadge,
  type Segment,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { PublishStatus } from "@/lib/storage";
import { PostFilter } from "@/lib/enums";
import type { Post } from "@/lib/types";

const FILTERS: readonly Segment<PostFilter>[] = [
  { value: PostFilter.All, label: "All" },
  { value: PostFilter.Published, label: "Published" },
  { value: PostFilter.Draft, label: "Draft" },
];

function matches(post: Post, needle: string) {
  if (!needle) return true;
  return (
    post.title.toLowerCase().includes(needle) ||
    post.slug.includes(needle) ||
    post.summary.toLowerCase().includes(needle) ||
    post.tags.some((tag) => tag.toLowerCase().includes(needle))
  );
}

export default function PostList({ posts, status }: { posts: Post[]; status: PublishStatus }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PostFilter>(PostFilter.All);

  const drafts = posts.filter((p) => p.draft).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter(
      (post) =>
        (filter === PostFilter.All || (filter === PostFilter.Draft) === post.draft) && matches(post, needle),
    );
  }, [posts, query, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold">Posts</h1>
          <p className="mt-1 text-meta text-muted">
            Everything in <span className="font-mono">content/posts/</span>. Drafts stay out of the
            built site.
          </p>
        </div>
        <ButtonLink href="/admin/edit/new/" variant="primary">
          <span aria-hidden>+</span> New post
        </ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={posts.length} />
        <Stat label="Published" value={posts.length - drafts} tone="text-ok" />
        <Stat label="Drafts" value={drafts} tone="text-warn" />
        <Stat label="Latest" value={posts[0] ? formatDate(posts[0].date) : "—"} small />
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, slug, summary or tag…"
            aria-label="Filter posts"
            className="min-w-48 flex-1"
          />
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            segments={FILTERS}
            label="Status filter"
          />
        </div>

        {visible.length === 0 ? (
          <Empty
            title={posts.length === 0 ? "Nothing written yet" : "No matches"}
            body={
              posts.length === 0
                ? "Your first post will be saved to content/posts/ as a plain markdown file."
                : `Nothing here matches “${query}”${filter !== PostFilter.All ? ` in ${filter}` : ""}.`
            }
            action={
              posts.length === 0 ? (
                <Link href="/admin/edit/new/">Write the first one →</Link>
              ) : (
                <button
                  onClick={() => {
                    setQuery("");
                    setFilter(PostFilter.All);
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((post) => (
              <li
                key={post.slug}
                className="group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-inset"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/edit/${post.slug}/`}
                      className="truncate font-medium transition-colors hover:text-accent"
                    >
                      {post.title || <span className="text-subtle">Untitled</span>}
                    </Link>
                    <StatusBadge draft={post.draft} />
                  </div>

                  <MetaRow
                    className="mt-1"
                    items={[
                      <time key="date" dateTime={post.date}>
                        {formatDate(post.date)}
                      </time>,
                      <span key="slug" className="truncate font-mono text-subtle">
                        /{post.slug}/
                      </span>,
                      post.tags.length > 0 && (
                        <span key="tags" className="truncate">
                          {post.tags.join(", ")}
                        </span>
                      ),
                    ]}
                  />
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={`/posts/${post.slug}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md px-2 py-1 text-meta text-muted opacity-0 transition-opacity hover:text-accent focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    View ↗
                  </a>
                  <ButtonLink href={`/admin/edit/${post.slug}/`} size="sm">
                    Edit
                  </ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <PublishPanel status={status} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "text-foreground",
  small,
}: {
  label: string;
  value: string | number;
  tone?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-raised px-4 py-3 shadow-sm">
      <p className="eyebrow">{label}</p>
      <p className={`mt-1 font-semibold tabular-nums ${tone} ${small ? "text-sm" : "text-xl"}`}>
        {value}
      </p>
    </div>
  );
}

function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="px-4 py-14 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-meta text-muted">{body}</p>
      <div className="mt-4 text-meta font-medium text-accent [&_a:hover]:underline [&_button:hover]:underline">
        {action}
      </div>
    </div>
  );
}
