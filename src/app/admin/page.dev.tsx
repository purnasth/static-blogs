import PostList from "@/components/admin/PostList";
import { getStore } from "@/lib/storage";

/** Dev-only: excluded from the production build (see next.config.ts). */
export default async function AdminPage() {
  const store = await getStore();
  const [posts, status] = await Promise.all([store.list(), store.status()]);

  return <PostList posts={posts} status={status} />;
}
