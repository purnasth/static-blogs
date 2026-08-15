import fs from "node:fs";
import path from "node:path";
import { getAllPosts } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-static";

/** Cover formats the writing desk accepts, mapped to the type `<enclosure>` needs. */
const MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/** The feed's own icon. PNG because RSS readers largely ignore SVG here. */
const FEED_IMAGE = "/images/purna-shrestha.png";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toRfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

/**
 * A reader renders `content:encoded` on its own origin, so every root-relative
 * `/images/...` and every `#heading` anchor rehype emits would resolve against
 * *that* domain and break. Both have to be absolute before they leave here.
 */
function absolutiseHtml(html: string, postUrl: string): string {
  return html.replace(/\b(src|href)="([^"]*)"/g, (whole, attr: string, value: string) => {
    if (value.startsWith("#")) return `${attr}="${escapeXml(postUrl + value)}"`;
    // `//host/path` is already absolute; only a lone leading slash is ours.
    if (value.startsWith("/") && !value.startsWith("//")) {
      return `${attr}="${escapeXml(absoluteUrl(value))}"`;
    }
    return whole;
  });
}

/** A literal `]]>` in a post would close the CDATA block early and void the feed. */
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/**
 * `<enclosure>` is how a reader finds a post's thumbnail, and the spec wants a
 * byte length — knowable only for covers we ship in `public/`, not remote ones.
 */
function enclosure(cover: string | undefined): string {
  if (!cover?.startsWith("/")) return "";
  const type = MIME_BY_EXTENSION[path.extname(cover).toLowerCase()];
  if (!type) return "";
  const file = path.join(process.cwd(), "public", cover);
  if (!fs.existsSync(file)) return "";
  const url = escapeXml(absoluteUrl(cover));
  return `\n      <enclosure url="${url}" length="${fs.statSync(file).size}" type="${type}" />`;
}

/** Mirrors the post page, which prints the cover above the article. */
function coverImage(cover: string | undefined, title: string): string {
  if (!cover) return "";
  const url = cover.startsWith("/") ? absoluteUrl(cover) : cover;
  return `<p><img src="${escapeXml(url)}" alt="${escapeXml(title)}" /></p>`;
}

export async function GET() {
  const posts = getAllPosts().filter((p) => !p.draft);

  const items = await Promise.all(
    posts.map(async (post) => {
      const url = escapeXml(absoluteUrl(`/posts/${post.slug}/`));
      const { html } = await renderMarkdown(post.body);
      const body = coverImage(post.cover, post.title) + absolutiseHtml(html, url);
      const categories = post.tags
        .map((tag) => `\n      <category>${escapeXml(tag)}</category>`)
        .join("");

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <dc:creator>${escapeXml(site.author)}</dc:creator>
      <description>${escapeXml(post.summary)}</description>${categories}${enclosure(post.cover)}
      <content:encoded>${cdata(body)}</content:encoded>
    </item>`;
    }),
  );

  // Dated from the newest post, not the clock, so rebuilding an unchanged site
  // produces a byte-identical feed instead of nudging every reader.
  const lastBuildDate = posts.length ? toRfc822(posts[0].date) : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${escapeXml(absoluteUrl("/"))}</link>
    <description>${escapeXml(site.description)}</description>
    <language>en</language>
    <generator>Next.js</generator>${lastBuildDate ? `\n    <lastBuildDate>${lastBuildDate}</lastBuildDate>` : ""}
    <atom:link href="${escapeXml(absoluteUrl("/rss.xml"))}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(absoluteUrl(FEED_IMAGE))}</url>
      <title>${escapeXml(site.title)}</title>
      <link>${escapeXml(absoluteUrl("/"))}</link>
    </image>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
