import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().filter((p) => !p.draft);

  return [
    { url: `${site.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/about/` },
    { url: `${site.url}/tags/` },
    ...posts.map((post) => ({
      url: `${site.url}/posts/${post.slug}/`,
      lastModified: new Date(`${post.date}T00:00:00Z`),
    })),
    ...getAllTags().map(({ tag }) => ({
      url: `${site.url}/tags/${encodeURIComponent(tag)}/`,
    })),
  ];
}
