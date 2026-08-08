/** Semantic colour vocabulary: components map through these, never raw colour classes. */
import { Tone } from "@/lib/enums";

export type { Tone };

export const TONE_SOFT: Record<Tone, string> = {
  neutral: "border-line bg-inset text-muted",
  accent: "border-accent-line bg-accent-soft text-accent",
  ok: "border-ok-line bg-ok-soft text-ok",
  warn: "border-warn-line bg-warn-soft text-warn",
  danger: "border-danger-line bg-danger-soft text-danger",
};

export const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-line-strong",
  accent: "bg-accent",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
};

export const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-muted",
  accent: "text-accent",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
};
