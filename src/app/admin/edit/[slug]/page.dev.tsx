import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";
import { getStore } from "@/lib/storage";

/** Dev-only: excluded from the production build (see next.config.ts). */
export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "new") {
    return <PostEditor post={null} today={new Date().toISOString().slice(0, 10)} />;
  }

  const store = await getStore();
  const post = await store.get(slug);
  if (!post) notFound();

  return <PostEditor post={post} today={new Date().toISOString().slice(0, 10)} />;
}
