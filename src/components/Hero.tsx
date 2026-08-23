import Image from "next/image";
import Link from "next/link";
import { profile } from "@/lib/profile";
import { site } from "@/lib/site";

/**
 * The landing block shared by the home and About pages: washed backdrop, pill,
 * the site headline, a lede, and whatever the page wants underneath — usually
 * `IntroCard`. Only the lede and the card body differ between the two pages, so
 * the chrome lives here once instead of being copied.
 */
export default function Hero({
  eyebrow = site.title,
  eyebrowHref,
  live = false,
  aurora = false,
  lede,
  children,
}: {
  eyebrow?: React.ReactNode;
  eyebrowHref?: string;
  live?: boolean;
  aurora?: boolean;
  lede: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-full w-screen -translate-x-1/2 overflow-hidden"
      >
        {aurora && <div className="aurora absolute inset-0" />}
        <div className="grid-lines absolute inset-0 opacity-60" />
      </div>

      <Pill href={eyebrowHref} live={live}>
        {eyebrow}
      </Pill>

      <h1 className="mt-6 text-balance text-hero font-semibold">
        {site.headline.lead}{" "}
        <em className="text-accent">{site.headline.accent}</em>{" "}
        {site.headline.trail}
      </h1>

      <p className="max-w-2xl text-pretty text-lede text-muted">{lede}</p>

      {children}
    </section>
  );
}

export function Pill({
  children,
  href,
  live = false,
}: {
  children: React.ReactNode;
  href?: string;
  live?: boolean;
}) {
  const className =
    "flex w-fit max-w-full items-center gap-2 rounded-full border border-line bg-raised/70 px-3 py-1 text-meta text-muted shadow-sm backdrop-blur";

  const body = (
    <>
      <span
        aria-hidden
        className={`size-1.5 shrink-0 rounded-full bg-accent ${
          live ? "animate-pulse" : ""
        }`}
      />
      <span className="truncate text-xxs">{children}</span>
    </>
  );

  if (!href) return <p className={className}>{body}</p>;

  return (
    <Link
      href={href}
      className={`${className} transition-colors hover:border-accent-line hover:text-foreground`}
    >
      {body}
    </Link>
  );
}

/**
 * The "hello, I'm Purna" card. The greeting, name, tagline and portrait are the
 * same everywhere; `children` is the part each page makes its own — links on
 * About, a snapshot of the blog on the home page.
 */
export function IntroCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative isolate mt-12 rounded-2xl border border-line bg-raised p-6 shadow-sm sm:py-16">
      <div
        aria-hidden
        className="aurora absolute inset-0 -z-10 rounded-2xl opacity-70"
      />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start md:gap-16">
        <div className="min-w-0 flex-1 text-left md:translate-x-4">
          <div className="flex mb-2">
            <i className="animate-wave text-2xl">👋</i>
          </div>
          <h2 className="text-title font-semibold">{profile.name}</h2>
          <p className="mt-4 text-sm text-muted">{profile.tagline}</p>
          {children}
        </div>
        <div className="w-full shrink-0 sm:w-2/5">
          <Image
            src={profile.avatar}
            alt={`Portrait of ${profile.name}`}
            width={1024}
            height={1024}
            className="pointer-events-none -z-10 h-48 w-full select-none object-contain object-bottom sm:h-52 sm:-translate-y-5 sm:scale-125 lg:scale-[1.85] xl:scale-[2]"
          />
        </div>
      </div>
    </div>
  );
}
