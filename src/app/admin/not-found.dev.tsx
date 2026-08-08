import NotFoundView from "@/components/NotFoundView";
import { ButtonLink } from "@/components/ui";

/**
 * Dev-only. Without this boundary a missing post under /admin falls through to
 * the root not-found, which SiteShell renders without any chrome at all.
 */
export default function AdminNotFound() {
  return (
    <NotFoundView
      title="No such post"
      description="Nothing in content/posts/ matches this address. It may have been renamed, deleted, or never saved."
    >
      <div className="mt-8 flex flex-wrap gap-2 items-center justify-center">
        <ButtonLink href="/admin/" variant="primary">
          Back to all posts
        </ButtonLink>
        <ButtonLink href="/admin/edit/new/">Write a new post</ButtonLink>
      </div>
    </NotFoundView>
  );
}
