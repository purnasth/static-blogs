import Link from "next/link";
import type { CSSProperties } from "react";
import PostStats from "@/components/engagement/PostStats";
import { formatDate } from "@/lib/format";
import type { PostSummary } from "@/lib/types";
import Image from "next/image";

/**
 * The newest post as a single full-bleed image with the writing set straight
 * onto it — no panel, no card-inside-a-card. Legibility comes from a gradient
 * scrim graded into the photo, which is why the type is light in both themes:
 * it is always sitting on a darkened image, never on the page background.
 */
export default function FeaturedPost({
  post,
  label = "Latest post",
}: {
  post: PostSummary;
  label?: string;
}) {
  return (
    <article className="group isolate relative mt-12 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
      <Link
        href={`/posts/${post.slug}/`}
        className="flex flex-col justify-end min-h-[20rem] sm:min-h-[24rem]"
      >
        <Backdrop post={post} />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c0806]/96 from-15% via-[#0c0806]/70 via-40% to-[#0c0806]/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_35%,rgba(0,0,0,0.45)_100%)]"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/15 m-2 rounded-3xl"
        />

        <div className="relative p-4 sm:p-6">
          <p className="flex items-center gap-2 text-micro text-white/65 border border-white/10 rounded-full px-3 py-1 w-fit backdrop-blur-sm bg-white/5">
            {label}
          </p>

          <h2 className="mt-2 max-w-2xl text-base md:text-xl font-semibold text-white drop-shadow-[0_1px_20px_rgba(0,0,0,0.35)]">
            {post.title}
          </h2>

          {post.summary && (
            <p className="mt-2 max-w-xl text-xs text-pretty text-white/70">
              {post.summary}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-3 text-meta text-white/55">
            <time dateTime={post.date} className="font-italic text-micro">
              {formatDate(post.date)}
            </time>
            <span aria-hidden className="scale-150 text-white/30">
              ·
            </span>
            <span className="font-italic text-micro">{post.readingTime}</span>

            <PostStats slug={post.slug} variant="overlay" />

            <span
              aria-hidden
              className="ml-auto inline-flex items-center gap-2 text-white/80 text-xs rounded-full px-3 py-1 backdrop-blur-sm bg-white/10 hover:text-white hover:bg-white/20 transition-colors"
            >
              Read
              <span className="">→</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function Backdrop({ post }: { post: PostSummary }) {
  const motion =
    "absolute inset-0 -z-10 transition-transform duration-[900ms] ease-out group-hover:scale-[1.15]";

  if (post.cover) {
    return (
      <Image
        priority
        fill
        src={post.cover}
        alt={`Cover for ${post.title}`}
        className={`${motion} h-full w-full object-cover object-center`}
      />
    );
  }

  let hash = 0;
  for (const char of post.title) hash = (hash * 31 + char.charCodeAt(0)) % 4096;
  const art = {
    "--art-h": String(8 + (hash % 34)),
    "--art-h2": String(30 + (hash % 34)),
    "--art-x": `${20 + (hash % 55)}%`,
    "--art-y": `${18 + (hash % 48)}%`,
    "--art-angle": `${hash % 180}deg`,
  } as CSSProperties;

  return <div aria-hidden className={`${motion} cover-art`} style={art} />;
}
