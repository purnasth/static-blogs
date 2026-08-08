import type { Tone } from "@/components/ui/tone";
import { TONE_DOT, TONE_SOFT } from "@/components/ui/tone";

type Props = {
  tone?: Tone;
  /** Shows a filled dot in the tone colour — for live status, not labels. */
  dot?: boolean;
  children: React.ReactNode;
};

export default function Badge({ tone = "neutral", dot, children }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-micro font-medium leading-5 tracking-wide ${TONE_SOFT[tone]}`}
    >
      {dot && <span aria-hidden className={`size-1.5 rounded-full ${TONE_DOT[tone]}`} />}
      {children}
    </span>
  );
}

export function StatusBadge({ draft }: { draft: boolean }) {
  return (
    <Badge tone={draft ? "warn" : "ok"} dot>
      {draft ? "Draft" : "Published"}
    </Badge>
  );
}
