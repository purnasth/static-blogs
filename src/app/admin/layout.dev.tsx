import Link from "next/link";
import { SiteFooter } from "@/components/SiteShell";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Writing desk" };

/**
 * Dev-only: excluded from the production build (see next.config.ts).
 *
 * The writing desk is a tool, not a page, so it opts out of the blog's reading
 * column entirely (SiteShell steps aside for /admin) and lays itself out
 * full-bleed on the inset surface, with content on raised panels.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-inset">
      <header className="veil sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight transition-colors hover:text-accent"
            >
              <span
                aria-hidden
                className="grid size-6 place-items-center rounded-md bg-accent text-meta text-accent-contrast"
              >
                ✎
              </span>
              Writing desk
            </Link>

            <nav className="flex items-center gap-1 text-meta">
              <Link
                href="/admin/"
                className="rounded-md px-2 py-1 text-muted transition-colors hover:bg-active hover:text-foreground"
              >
                Posts
              </Link>
              <Link
                href="/admin/stats/"
                className="rounded-md px-2 py-1 text-muted transition-colors hover:bg-active hover:text-foreground"
              >
                Numbers
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              target="_blank"
              className="text-meta text-muted transition-colors hover:text-accent"
            >
              View site ↗
            </Link>
            <span
              title="These routes exist only in `next dev` — they are not part of the production build."
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1 text-micro font-medium text-muted"
            >
              <span aria-hidden className="size-1.5 rounded-full bg-ok" />
              Local only · never deployed
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col px-5 sm:px-8">
        <main className="flex-1 py-8">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
