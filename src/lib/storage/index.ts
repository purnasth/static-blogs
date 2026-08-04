import type { Post, PostFrontmatter } from "@/lib/types";

export type SaveInput = {
  slug: string;
  /** Set when renaming an existing post, so the old file is removed. */
  previousSlug?: string;
  frontmatter: PostFrontmatter;
  body: string;
};

export type PublishStatus = {
  branch: string;
  remote: string | null;
  /** Paths changed since the last commit. */
  dirty: string[];
};

/**
 * Everything the admin needs to mutate content. The local implementation
 * writes to the working tree; a future GitHub implementation commits through
 * the API so the admin can be deployed (see README "Shape B").
 */
export interface PostStore {
  readonly kind: "local" | "github";
  list(): Promise<Post[]>;
  get(slug: string): Promise<Post | null>;
  save(input: SaveInput): Promise<{ slug: string }>;
  remove(slug: string): Promise<void>;
  saveImage(filename: string, data: Buffer): Promise<{ url: string }>;
  status(): Promise<PublishStatus>;
  publish(message: string): Promise<{ pushed: boolean; detail: string }>;
}

export async function getStore(): Promise<PostStore> {
  // Only the local store exists today. When Shape B lands, branch here on an
  // env var (e.g. BLOG_STORE=github) and return the GitHub-backed store.
  const { localStore } = await import("@/lib/storage/local");
  return localStore;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
