import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

export type Heading = {
  /** Matches the `id` rehype-slug wrote, so `#id` always resolves. */
  id: string;
  text: string;
  level: 2 | 3;
};

export type RenderedMarkdown = {
  html: string;
  headings: Heading[];
};

const HEADING_RE = /<h([23])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;

/**
 * Pull the table of contents out of the rendered HTML rather than the markdown
 * AST. rehype-slug has already resolved duplicate-title collisions by then, so
 * these ids are guaranteed to be the ones on the page.
 */
function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  for (const [, level, id, inner] of html.matchAll(HEADING_RE)) {
    const text = inner
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (text) headings.push({ id, text, level: Number(level) as 2 | 3 });
  }
  return headings;
}

/**
 * Markdown -> HTML at build time, so published pages ship zero client JS
 * for content rendering.
 */
export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify)
    .process(markdown);

  const html = String(file);
  return { html, headings: extractHeadings(html) };
}
