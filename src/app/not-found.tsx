import NotFoundView from "@/components/NotFoundView";
import { TagList } from "@/components/Tag";
import { ButtonLink, LinkList, LinkRow } from "@/components/ui";
import { RECENT_POSTS_ON_NOT_FOUND } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getAllTags, getPostSummaries } from "@/lib/posts";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  const recent = getPostSummaries().slice(0, RECENT_POSTS_ON_NOT_FOUND);
  const tags = getAllTags().slice(0, 6);

  return (
    <NotFoundView
      title="This page went missing"
      description="The link may be out of date, the post may have been renamed, or it may still be a draft."
    >
      <div className="mt-8 flex flex-wrap gap-2 items-center justify-center">
        <ButtonLink href="/" variant="primary">
          Read the latest posts
        </ButtonLink>
        <ButtonLink href="/tags/">Browse by tag</ButtonLink>
      </div>

      {recent.length > 0 && (
        <section className="mt-16">
          <h2 className="eyebrow mb-4">Recently published</h2>
          <LinkList>
            {recent.map((post) => (
              <li key={post.slug}>
                <LinkRow
                  href={`/posts/${post.slug}/`}
                  label={post.title}
                  aside={
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  }
                />
              </li>
            ))}
          </LinkList>
        </section>
      )}

      {tags.length > 0 && (
        <section className="mt-10">
          <h2 className="eyebrow mb-3">Or pick a topic</h2>
          <TagList tags={tags} />
        </section>
      )}
    </NotFoundView>
  );
}
