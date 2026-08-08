import TagChip from "@/components/TagChip";
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

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-8">
          {tags.map(({ tag, count }) => (
            <TagChip key={tag} tag={tag} count={count} size="md" />
          ))}
        </div>
      )}
    </div>
  );
}
