import Link from "next/link";
import { getAllTags } from "@/lib/posts";

export const metadata = { title: "Tags" };

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Tags</h1>
      {tags.length === 0 ? (
        <p className="text-muted">No tags yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}/`}
              className="rounded-full border border-line px-3 py-1 text-sm hover:border-accent hover:text-accent"
            >
              {tag} <span className="text-muted">{count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
