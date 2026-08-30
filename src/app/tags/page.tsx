import { TagList } from "@/components/Tag";
import { getAllTags } from "@/lib/posts";

export const metadata = { title: "Tags" };

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div>
      <header className="border-b border-line pb-8">
        <h1 className="text-display font-semibold">Tags</h1>
        <p className="mt-3 text-lede text-muted">
          {tags.length === 0
            ? "Nothing tagged yet."
            : `${tags.length} ${tags.length === 1 ? "tag" : "tags"} across the archive, most used first.`}
        </p>
      </header>

      <TagList tags={tags} size="inherit" className="pt-8" />
    </div>
  );
}
