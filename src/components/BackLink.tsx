import Link from "next/link";

export default function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="meta inline-flex items-center gap-1.5 transition-colors hover:text-accent uppercase"
    >
      <span aria-hidden>←</span> {children}
    </Link>
  );
}
