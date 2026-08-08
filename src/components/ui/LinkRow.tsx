import Link from "next/link";

type Props = {
  href: string;
  label: React.ReactNode;
  /** Right-aligned secondary text: a date, a reading time, a count. */
  aside?: React.ReactNode;
};

export default function LinkRow({ href, label, aside }: Props) {
  return (
    <Link href={href} className="group flex items-baseline justify-between gap-4 py-3">
      <span className="font-medium transition-colors group-hover:text-accent">{label}</span>
      {aside && <span className="meta shrink-0">{aside}</span>}
    </Link>
  );
}

export function LinkList({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-line border-y border-line">{children}</ul>;
}
