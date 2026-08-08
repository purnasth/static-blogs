import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import SiteShell from "@/components/SiteShell";
import { themeInitScript } from "@/components/ThemeToggle";
import { site } from "@/lib/site";
import "./globals.css";

/**
 * next/font downloads these at build time and serves them from our own origin,
 * so the deployed site makes no request to Google. The `variable` names are the
 * ones globals.css reads through `--font-sans` / `--font-mono`.
 *
 * Hanken Grotesk ships true italics rather than leaving the browser to fake an
 * oblique — which matters here, because markdown emphasis is everywhere.
 */
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-stack",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-stack",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.title}` },
  description: site.description,
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      // themeInitScript writes data-theme here before React hydrates, so this
      // element's attributes are expected to differ from the server render.
      suppressHydrationWarning
    >
      <head>
        {/* Must run before paint, or a stored dark theme flashes light. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
