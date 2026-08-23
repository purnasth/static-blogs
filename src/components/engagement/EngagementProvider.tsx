"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  emptyEngagement,
  ENGAGEMENT_ENDPOINT,
  getVisitorId,
  REACT_ENDPOINT,
  type Engagement,
  type ReactionKind,
} from "@/lib/engagement";

/**
 * Owns the one engagement request a post makes, and shares its result.
 *
 * The header view count, the reaction bar and the floating bar all show the
 * same numbers. Fetching in each of them would mean three requests and three
 * chances to disagree, so the fetch lives here and they subscribe.
 *
 * It is a client component wrapping server-rendered `children`, which stays
 * server-rendered — passing them through as a prop is what keeps the article
 * itself out of the client bundle.
 */

type EngagementState = {
  data: Engagement;
  /** True once the server's numbers have replaced the build-time snapshot. */
  live: boolean;
  /** The API is unreachable — consumers should render nothing. */
  failed: boolean;
  toggle: (kind: ReactionKind) => void;
};

const EngagementContext = createContext<EngagementState | null>(null);

export function useEngagement(): EngagementState {
  const value = useContext(EngagementContext);
  if (!value) throw new Error("useEngagement must be used inside <EngagementProvider>.");
  return value;
}

type Props = {
  slug: string;
  /** Counts baked into the static HTML at build time, if any. */
  initial?: Engagement;
  children: React.ReactNode;
};

export default function EngagementProvider({ slug, initial, children }: Props) {
  const [data, setData] = useState<Engagement>(initial ?? emptyEngagement());
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const visitorRef = useRef<string>("");

  // Registers the view and pulls this visitor's own reactions in one request.
  useEffect(() => {
    let cancelled = false;
    visitorRef.current = getVisitorId();

    fetch(ENGAGEMENT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, visitor: visitorRef.current }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((fresh: Engagement) => {
        if (cancelled) return;
        setData(fresh);
        setLive(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const toggle = useCallback(
    async (kind: ReactionKind) => {
      let held = false;

      // Optimistic: the button answers the click, then the server confirms.
      setData((current) => {
        held = current.mine.includes(kind);
        return {
          ...current,
          reactions: {
            ...current.reactions,
            [kind]: Math.max(0, current.reactions[kind] + (held ? -1 : 1)),
          },
          mine: held ? current.mine.filter((k) => k !== kind) : [...current.mine, kind],
        };
      });

      try {
        const response = await fetch(REACT_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, visitor: visitorRef.current, kind }),
        });
        if (!response.ok) throw new Error(String(response.status));
        setData((await response.json()) as Engagement);
      } catch {
        // Roll the optimistic edit back rather than leave a count that lies.
        setData((current) => ({
          ...current,
          reactions: {
            ...current.reactions,
            [kind]: Math.max(0, current.reactions[kind] + (held ? 1 : -1)),
          },
          mine: held ? [...current.mine, kind] : current.mine.filter((k) => k !== kind),
        }));
      }
    },
    [slug],
  );

  const value = useMemo<EngagementState>(
    () => ({ data, live, failed, toggle }),
    [data, live, failed, toggle],
  );

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}
