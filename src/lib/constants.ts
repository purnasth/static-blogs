/** Tunable values. Nothing here should be repeated as a literal elsewhere. */

/** Roughly what a search engine renders before truncating a description. */
export const SUMMARY_MAX_LENGTH = 160;

/** Matches the default used by the `reading-time` package. */
export const WORDS_PER_MINUTE = 220;

export const SLUG_MAX_LENGTH = 80;

export const COMMIT_MESSAGE_MIN_LENGTH = 8;

export const COMMIT_MESSAGE_EXAMPLES = [
  "posts: add about Purna's life and work",
  "images: add cover for the travel diaries",
] as const;

export const COMMIT_MESSAGE_PLACEHOLDER = COMMIT_MESSAGE_EXAMPLES[0];

export const THEME_STORAGE_KEY = "theme";
export const THEME_CHANGE_EVENT = "themechange";

export const RELATED_POSTS_LIMIT = 3;
export const RECENT_POSTS_ON_NOT_FOUND = 3;

/** Below this, a contents rail is noise rather than navigation. */
export const TOC_MIN_HEADINGS = 2;

/** Distance from the viewport top that counts as "currently reading". */
export const TOC_ACTIVE_OFFSET_PX = 140;

/**
 * Height of the writing surface, shared by the source and preview panes so
 * split view stays aligned. Written as complete class names because Tailwind
 * scans source text — a concatenated `lg:${...}` would never be generated.
 */
export const EDITOR_PANE_HEIGHT = "h-[32rem]";
export const EDITOR_PANE_HEIGHT_LG = "lg:h-[32rem]";
export const EDITOR_PANE_HEIGHT_FOCUS = "h-[calc(100vh-11rem)]";

export const IS_DEV = process.env.NODE_ENV === "development";
