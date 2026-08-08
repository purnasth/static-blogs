"use client";

export type Segment<T extends string> = {
  value: T;
  label: React.ReactNode;
  /** Falls back to the value; used for the tooltip and the accessible name. */
  title?: string;
  /** Hides the segment below a breakpoint, e.g. "lg" for wide-only modes. */
  showFrom?: "sm" | "lg";
};

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  segments: readonly Segment<T>[];
  label: string;
  className?: string;
};

const SHOW_FROM = {
  sm: "hidden sm:inline-flex",
  lg: "hidden lg:inline-flex",
} as const;

/** Radio semantics so arrow keys move between options natively. */
export default function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  label,
  className = "",
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex rounded-lg border border-line bg-inset p-0.5 ${className}`}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            role="radio"
            aria-checked={selected}
            title={segment.title ?? segment.value}
            onClick={() => onChange(segment.value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-meta font-medium capitalize transition-colors ${
              segment.showFrom ? SHOW_FROM[segment.showFrom] : ""
            } ${
              selected
                ? "bg-raised text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
