"use client";

import { useEffect, useState } from "react";
import { TOC_ACTIVE_OFFSET_PX, TOC_MIN_HEADINGS } from "@/lib/constants";
import type { Heading } from "@/lib/markdown";

/** Tracks the heading nearest the top of the viewport, so it never flickers. */
export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    if (headings.length === 0) return;

    let frame = 0;

    function measure() {
      frame = 0;
      // The heading whose top has most recently passed the reading line.
      const line = TOC_ACTIVE_OFFSET_PX;
      let current = headings[0]?.id ?? null;
      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (el && el.getBoundingClientRect().top <= line) current = heading.id;
      }
      setActiveId(current);
    }

    function onScroll() {
      if (frame === 0) frame = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [headings]);

  if (headings.length < TOC_MIN_HEADINGS) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-24 max-h-[calc(100vh-8rem)] w-48 overflow-y-auto"
    >
      <p className="meta mb-3 font-medium uppercase tracking-[0.09em] text-subtle">On this page</p>
      <ul className="space-y-0.5 border-l border-line">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active ? "location" : undefined}
                className={`-ml-px block border-l py-1 text-meta leading-snug transition-colors ${
                  heading.level === 3 ? "pl-6" : "pl-3.5"
                } ${
                  active
                    ? "border-accent font-medium text-foreground"
                    : "border-transparent text-muted hover:border-line-strong hover:text-foreground"
                }`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
