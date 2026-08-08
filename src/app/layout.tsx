import type { Metadata, Viewport } from "next";
import { Sen, JetBrains_Mono } from "next/font/google";
import SiteShell from "@/components/SiteShell";
import { themeInitScript } from "@/components/ThemeToggle";
import { site } from "@/lib/site";
import "./globals.css";

/**
 * next/font downloads these at build time and serves them from our own origin,
 * so the deployed site makes no request to Google. The `variable` names are the
 * ones globals.css reads through `--font-sans` / `--font-mono`.
 *
 * Sen is variable across wght 400–800, so it covers every weight the UI asks
 * for without a `weight` argument. It ships no italic, though — markdown
 * emphasis renders as a synthesised oblique.
 */
const sans = Sen({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-stack",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-stack",
});

/**
 * Site-wide defaults; a page overrides what it needs.
 *
 * `metadataBase` is what lets every page below write plain paths — "/about/",
 * "/opengraph-image" — and have Next resolve them to absolute URLs. Social
 * crawlers and canonical tags both require absolute, so this one line is what
 * keeps the domain out of the rest of the codebase.
 *
 * Deliberately no `alternates.canonical` here: set at the root it would be
 * inherited by any page that forgot its own, and every such page would then
 * tell search engines it is really the home page. Each page declares its own,
 * so forgetting costs a missing tag rather than a wrong one.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.homeTitle, template: `%s — ${site.title}` },
  description: site.metaDescription,
  authors: [{ name: site.author }],
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
  openGraph: {
    type: "website",
    siteName: site.title,
    title: site.homeTitle,
    description: site.metaDescription,
    url: "/",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.homeTitle,
    description: site.metaDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    // Without max-image-preview, Google may only ever show a thumbnail;
    // "large" is what makes a post eligible for a full-width image result.
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  // Matches --bg in globals.css per scheme, so mobile browser chrome blends
  // into the page instead of flashing white above a dark theme.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfdfc" },
    { media: "(prefers-color-scheme: dark)", color: "#101010" },
  ],
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
