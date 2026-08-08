import Link from "next/link";
import TagChip from "@/components/TagChip";
import { Badge, MetaRow } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { PostSummary } from "@/lib/types";

/** Title is the only link, so the row is one tab stop but hovers as a whole. */
export default function PostRow({ post }: { post: PostSummary }) {
  return (
    <article className="group relative py-6">
      <MetaRow
        items={[
          <time key="date" dateTime={post.date}>
            {formatDate(post.date)}
          </time>,
          post.readingTime,
          post.draft && (
            <Badge key="draft" tone="warn">
              draft
            </Badge>
          ),
        ]}
      />

      <h2 className="mt-1.5 text-title font-semibold">
        <Link
          href={`/posts/${post.slug}/`}
          className="transition-colors after:absolute after:inset-0 group-hover:text-accent"
        >
          {post.title}
        </Link>
      </h2>

      {post.summary && <p className="mt-2 text-muted">{post.summary}</p>}

      {post.tags.length > 0 && (
        <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  );
}
