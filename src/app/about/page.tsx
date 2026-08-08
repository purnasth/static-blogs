import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { renderMarkdown } from "@/lib/markdown";
import { site } from "@/lib/site";

const ABOUT_FILE = path.join(process.cwd(), "content", "about.md");

const DESCRIPTION = `About ${site.author} — ${site.description}`;

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about/" },
  // Declaring openGraph at all replaces the root layout's block wholesale, so
  // the site card has to be named again — omit it and this page shares with no
  // image at all.
  openGraph: {
    type: "profile",
    url: "/about/",
    title: `About — ${site.author}`,
    description: DESCRIPTION,
    siteName: site.title,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: `About — ${site.author}`,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default async function AboutPage() {
  const markdown = fs.existsSync(ABOUT_FILE)
    ? fs.readFileSync(ABOUT_FILE, "utf8")
    : "# About\n\nEdit `content/about.md` to change this page.";
  const { html } = await renderMarkdown(markdown);

  return (
    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
