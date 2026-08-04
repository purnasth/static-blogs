import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/format";

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

  const html = await renderMarkdown(post.body);

  return (
    <article>
      <header className="mb-8">
        <div className="flex items-baseline gap-3 text-sm text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.draft && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-xs text-accent">draft</span>
          )}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{post.title}</h1>
        {post.summary && <p className="mt-3 text-lg text-muted">{post.summary}</p>}
      </header>

      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover} alt="" className="mb-8 w-full rounded-lg" />
      )}

      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />

      {post.tags.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2 border-t border-line pt-6">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}/`}
              className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-accent hover:text-accent"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
