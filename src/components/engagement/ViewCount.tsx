"use client";

import { Eye } from "lucide-react";
import { useEngagement } from "@/components/engagement/EngagementProvider";
import RollingCount from "@/components/engagement/RollingCount";

/**
 * Views in the post header, reading as metadata beside the date rather than as
 * a scoreboard.
 *
 * It carries its own separator instead of being passed to `MetaRow`, because
 * MetaRow drops falsy *items* — and `<ViewCount />` is always a truthy element
 * even on the render where it returns null. Inside MetaRow it would leave a
 * stray dot hanging off the end of the line.
 */
export default function ViewCount() {
  const { data, live } = useEngagement();

  // Nothing worth showing until a real number arrives.
  if (!live && data.views === 0) return null;

  return (
    <span className="meta flex items-center gap-2.5 font-italic">
      <span aria-hidden className="scale-150 text-subtle">
        ·
      </span>
      <span className="flex items-center gap-1.5">
        <Eye aria-hidden className="size-3.5 shrink-0" strokeWidth={1.5} />
        <RollingCount value={data.views} />
        <span>{data.views === 1 ? "view" : "views"}</span>
      </span>
    </span>
  );
}
