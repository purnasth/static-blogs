import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { Post, PostFrontmatter, PostSummary } from "@/lib/types";

export const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/** Drafts are visible while writing locally, hidden in the built site. */
const showDrafts = process.env.NODE_ENV === "development";

/** YAML turns an unquoted `date: 2026-08-04` into a Date, a quoted one into a string. */
function toIsoDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return new Date(0).toISOString().slice(0, 10);
}

function normalise(data: Record<string, unknown>, slug: string): PostFrontmatter {
  return {
    title: typeof data.title === "string" ? data.title : slug,
    date: toIsoDate(data.date),
    summary: typeof data.summary === "string" ? data.summary : "",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    cover: typeof data.cover === "string" && data.cover ? data.cover : undefined,
    draft: data.draft === true,
  };
}

export function readPostFile(slug: string): Post | null {
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return { ...normalise(data, slug), slug, body: content };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readPostFile(f.replace(/\.md$/, "")))
    .filter((p): p is Post => p !== null)
    .filter((p) => showDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostSummaries(): PostSummary[] {
  return getAllPosts().map(({ body, ...rest }) => ({
    ...rest,
    readingTime: readingTime(body).text,
  }));
}

export function getPost(slug: string): Post | null {
  const post = readPostFile(slug);
  if (!post) return null;
  if (post.draft && !showDrafts) return null;
  return post;
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
