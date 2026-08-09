import type { Metadata } from "next";
import { Sen, Gelasio, JetBrains_Mono } from "next/font/google";
import SiteShell from "@/components/SiteShell";
import { themeInitScript } from "@/components/ThemeToggle";
import { site } from "@/lib/site";
import "./globals.css";

const sans = Sen({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-stack",
});

const italic = Gelasio({
  subsets: ["latin"],
  style: "italic",
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-italic-stack",
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
      className={`${sans.variable} ${italic.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
