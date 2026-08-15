"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { navItems, site } from "@/lib/site";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * The blog's chrome. The writing desk renders its own full-bleed layout, so it
 * opts out here rather than living in a separate route group — a route group
 * would cost the 404 page its header and footer.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <>
      <a
        href="#content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:border focus-visible:border-line focus-visible:bg-raised focus-visible:px-4 focus-visible:py-2 focus-visible:shadow-md"
      >
        Skip to content
      </a>

      <header className="veil sticky top-0 z-40 border-b border-line">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 sm:flex-nowrap sm:px-8">
          <Link
            href="/"
            className="whitespace-nowrap text-ui font-semibold tracking-tight transition-colors hover:text-accent"
          >
            {site.title}
          </Link>

          <nav className="-ml-2.5 order-3 flex w-full items-center gap-1 sm:order-none sm:ml-auto sm:w-auto">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-2.5 py-1 text-meta transition-colors ${
                      item.devOnly
                        ? "text-accent hover:text-accent-hover"
                        : active
                          ? "font-medium text-foreground"
                          : "text-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={`mx-auto mt-1 block h-px w-4 rounded-full ${
                        active ? "bg-accent" : "bg-transparent"
                      }`}
                    />
                  </Link>
                );
              })}
          </nav>

          <div className="ml-auto shrink-0 sm:ml-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col px-5 sm:px-8">
        <main id="content" className="flex-1 py-12 sm:py-16">
          {children}
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8">
      <div className="meta flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <span>
          © {new Date().getFullYear()} {site.author}
        </span>
        <nav className="flex items-center gap-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-accent ${
                item.devOnly ? "text-accent" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a href="/rss.xml" className="transition-colors hover:text-accent">
            RSS
          </a>
        </nav>
      </div>
    </footer>
  );
}
