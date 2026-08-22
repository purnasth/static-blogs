"use client";

import { formatCount } from "@/lib/engagement";

/**
 * A number that slides into place when it changes.
 *
 * The `key` is the whole trick: changing it remounts the span, which restarts
 * the CSS animation. Without it the animation would only ever play once.
 */
export default function RollingCount({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex overflow-hidden tabular-nums ${className}`}>
      <span key={value} className="count-roll">
        {formatCount(value)}
      </span>
    </span>
  );
}
