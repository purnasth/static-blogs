import { SUMMARY_ENDPOINT, type EngagementSummary } from "@/lib/engagement";

/**
 * One fetch of `/api/summary`, shared by every listing row on the page.
 *
 * A home page with twenty posts must not make twenty requests, and threading a
 * provider through `PostRow` would mean remembering to wrap every page that
 * lists posts — home, each tag page, the 404. A module-level store sidesteps
 * both: the first row to mount starts the fetch, the rest join it, and a page
 * that forgets nothing simply works.
 *
 * Read through `useSyncExternalStore`, the same way `ThemeToggle` reads theme.
 */

const EMPTY: EngagementSummary = {};

let data: EngagementSummary = EMPTY;
let started = false;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (!started) {
    started = true;
    fetch(SUMMARY_ENDPOINT)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((fresh: EngagementSummary) => {
        data = fresh;
        for (const notify of listeners) notify();
      })
      .catch(() => {
        // No counts is a fine outcome — the rows just render without them.
      });
  }

  return () => {
    listeners.delete(listener);
  };
}

/** Stable between updates: `data` is only ever replaced, never mutated. */
export const getSnapshot = (): EngagementSummary => data;

/** The server has no counts, and the first client render must agree with it. */
export const getServerSnapshot = (): EngagementSummary => EMPTY;
