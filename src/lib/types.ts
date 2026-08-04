export type PostFrontmatter = {
  title: string;
  date: string; // ISO date, e.g. "2026-08-04"
  summary: string;
  tags: string[];
  cover?: string; // path under /public, e.g. "/images/foo.jpg"
  draft: boolean;
};

export type Post = PostFrontmatter & {
  slug: string;
  body: string; // raw markdown
};

export type PostSummary = PostFrontmatter & {
  slug: string;
  readingTime: string;
};
