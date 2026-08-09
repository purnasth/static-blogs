import Link from "next/link";

type Props = {
  tag: string;
  count?: number;
  /** `sm` for inline metadata rows, `md` for tag indexes. */
  size?: "sm" | "md";
};

export default function TagChip({ tag, count, size = "sm" }: Props) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}/`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-raised text-muted transition-colors hover:border-accent hover:text-accent font-italic ${
        size === "sm" ? "px-2.5 py-0.5 text-meta" : "px-3.5 py-1.5 text-sm"
      }`}
    >
      {tag}
      {count !== undefined && (
        <span className="tabular-nums text-subtle" aria-label={`${count} posts`}>
          {count}
        </span>
      )}
    </Link>
  );
}
