import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.title}` },
  description: site.description,
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 sm:px-6">
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-10">
            <Link href="/" className="text-lg font-semibold tracking-tight hover:text-accent">
              {site.title}
            </Link>
            <nav className="flex gap-5 text-sm text-muted">
              {site.nav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-accent">
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          <main className="flex-1 pb-16">{children}</main>

          <footer className="border-t border-line py-8 text-sm text-muted">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                © {new Date().getFullYear()} {site.author}
              </span>
              <a href="/rss.xml" className="hover:text-accent">
                RSS
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
