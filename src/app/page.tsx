import Link from "next/link";
import { getPostSummaries } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { site } from "@/lib/site";

export default function Home() {
  const posts = getPostSummaries();

  return (
    <div>
      <p className="mb-10 text-muted">{site.description}</p>

      {posts.length === 0 ? (
        <p className="text-muted">
          No posts yet. Run <code className="font-mono text-sm">npm run dev</code> and open{" "}
          <code className="font-mono text-sm">/admin</code> to write your first one.
        </p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <article>
                <div className="flex items-baseline gap-3 text-sm text-muted">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden>·</span>
                  <span>{post.readingTime}</span>
                  {post.draft && (
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 text-xs text-accent">draft</span>
                  )}
                </div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  <Link href={`/posts/${post.slug}/`} className="hover:text-accent">
                    {post.title}
                  </Link>
                </h2>
                {post.summary && <p className="mt-1 text-muted">{post.summary}</p>}
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
