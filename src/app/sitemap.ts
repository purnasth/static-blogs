import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().filter((p) => !p.draft);

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about/") },
    { url: absoluteUrl("/tags/") },
    ...posts.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}/`),
      lastModified: new Date(`${post.date}T00:00:00Z`),
    })),
    ...getAllTags().map(({ tag }) => ({
      url: absoluteUrl(`/tags/${encodeURIComponent(tag)}/`),
    })),
  ];
}
