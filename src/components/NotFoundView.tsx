"use client";

import { usePathname } from "next/navigation";

type Props = {
  code?: string;
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
};

/** Path is resolved on the client — a static export cannot know it at build time. */
export default function NotFoundView({
  code = "404",
  title,
  description,
  children,
}: Props) {
  const pathname = usePathname();

  return (
    <main className="mx-auto max-w-3xl">
      <div>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none select-none font-semibold leading-none tracking-tighter text-accent-soft flex items-center justify-center"
            style={{ fontSize: "clamp(7rem, 26vw, 14rem)" }}
          >
            {code}
          </span>

          <div className="-mt-[0.35em] sm:-mt-[0.45em] text-center">
            <h1 className="text-balance text-display font-semibold">{title}</h1>
            <p className="mt-4 max-w-md mx-auto text-base text-muted">
              {description}
            </p>

            {pathname && (
              <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-inset px-3 py-1.5">
                <span className="eyebrow shrink-0">Requested</span>
                <code className="truncate font-mono text-meta text-foreground line-through decoration-danger/70">
                  {pathname}
                </code>
              </p>
            )}
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}
