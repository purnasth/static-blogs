import Link from "next/link";

export type TagSize = "inherit" | "sm" | "md" | "lg";

const TEXT: Record<TagSize, string> = {
  inherit: "",
  sm: "text-meta",
  md: "text-body",
  lg: "text-title",
};

const GAP: Record<TagSize, string> = {
  inherit: "gap-x-4 gap-y-2",
  sm: "gap-x-3 gap-y-1.5",
  md: "gap-x-4 gap-y-2.5",
  lg: "gap-x-5 gap-y-3",
};

type LabelProps = {
  tag: string;
  count?: number;
  size?: TagSize;
  className?: string;
  /** Trailing slot, for the remove button on editable tags. */
  children?: React.ReactNode;
};

/**
 * The `#name` mark on its own — a label, not a destination. Used by the tag
 * archive heading and the editor. Inside a `tag-link` it picks up that link's
 * hover; standalone it just sits there. Styling lives in `globals.css`.
 */
export function TagLabel({ tag, count, size = "sm", className = "", children }: LabelProps) {
  return (
    <span className={`tag-mark ${TEXT[size]} ${className}`}>
      <span className="tag-gleam">
        <span aria-hidden className="tag-hash">
          #
        </span>
        {tag}
      </span>
      {count !== undefined && (
        <>
          <span aria-hidden className="tag-count">
            {count}
          </span>
          <span className="sr-only">{`, ${count} ${count === 1 ? "post" : "posts"}`}</span>
        </>
      )}
      {children}
    </span>
  );
}

type Props = Omit<LabelProps, "className" | "children">;

/** A tag as a link to its archive. The single way tags appear on the site. */
export default function Tag({ tag, count, size = "sm" }: Props) {
  return (
    <Link href={`/tags/${encodeURIComponent(tag)}/`} className="tag-link">
      <TagLabel tag={tag} count={count} size={size} />
    </Link>
  );
}

type ListProps = {
  /** Bare names, or `{ tag, count }` rows straight from `getAllTags()`. */
  tags: ReadonlyArray<string | { tag: string; count?: number }>;
  size?: TagSize;
  className?: string;
};

export function TagList({ tags, size = "sm", className = "" }: ListProps) {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center ${GAP[size]} ${className}`}>
      {tags.map((entry) => {
        const { tag, count } = typeof entry === "string" ? { tag: entry, count: undefined } : entry;
        return <Tag key={tag} tag={tag} count={count} size={size} />;
      })}
    </div>
  );
}
