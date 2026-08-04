import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTags, getPostSummaries } from "@/lib/posts";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  return { title: `Posts tagged “${decodeURIComponent(tag)}”` };
}

export default async function TagPage({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = getPostSummaries().filter((p) => p.tags.includes(decoded));
  if (posts.length === 0) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Tagged <span className="text-accent">{decoded}</span>
      </h1>
      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <time className="text-sm text-muted" dateTime={post.date}>
              {formatDate(post.date)}
            </time>
            <h2 className="text-lg font-semibold tracking-tight">
              <Link href={`/posts/${post.slug}/`} className="hover:text-accent">
                {post.title}
              </Link>
            </h2>
          </li>
        ))}
      </ul>
    </div>
  );
}
