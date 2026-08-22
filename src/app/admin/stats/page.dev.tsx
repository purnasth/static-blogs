import StatsDashboard from "@/components/admin/StatsDashboard";
import { getAllPosts } from "@/lib/posts";

/** Dev-only: excluded from the production build (see next.config.ts). */

export const metadata = { title: "Numbers · Writing desk" };

export default function AdminStatsPage() {
  // Titles come from the filesystem; the numbers come from production. Drafts
  // are included so a post that was published and pulled still resolves a name.
  const posts = getAllPosts().map(({ slug, title, draft }) => ({ slug, title, draft }));

  return <StatsDashboard posts={posts} />;
}
