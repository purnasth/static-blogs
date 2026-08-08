import { Fragment } from "react";

type Props = {
  /** Falsy entries are dropped, so callers can inline conditionals. */
  items: React.ReactNode[];
  className?: string;
};

/** Dot-separated metadata line; separators stay out of the accessibility tree. */
export default function MetaRow({ items, className = "" }: Props) {
  const visible = items.filter(Boolean);

  return (
    <div className={`meta flex flex-wrap items-center gap-x-2.5 gap-y-1 ${className}`}>
      {visible.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <span aria-hidden className="text-subtle">
              ·
            </span>
          )}
          {item}
        </Fragment>
      ))}
    </div>
  );
}
