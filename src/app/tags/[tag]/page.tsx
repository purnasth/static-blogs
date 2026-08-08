import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import PostRow from "@/components/PostRow";
import { getAllTags, getPostSummaries } from "@/lib/posts";

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
