/** Const objects rather than `enum`: no runtime emit, and they narrow structurally. */

export const Theme = {
  System: "system",
  Light: "light",
  Dark: "dark",
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export const EditorViewMode = {
  Write: "write",
  Split: "split",
  Preview: "preview",
} as const;
export type EditorViewMode = (typeof EditorViewMode)[keyof typeof EditorViewMode];

export const PostFilter = {
  All: "all",
  Published: "published",
  Draft: "draft",
} as const;
export type PostFilter = (typeof PostFilter)[keyof typeof PostFilter];

export const NoticeKind = {
  Ok: "ok",
  Error: "error",
  Info: "info",
} as const;
export type NoticeKind = (typeof NoticeKind)[keyof typeof NoticeKind];

export const Tone = {
  Neutral: "neutral",
  Accent: "accent",
  Ok: "ok",
  Warn: "warn",
  Danger: "danger",
} as const;
export type Tone = (typeof Tone)[keyof typeof Tone];
