import { TONE_TEXT } from "@/components/ui/tone";
import { NoticeKind } from "@/lib/enums";

export type { NoticeKind };

export type NoticeState = { kind: NoticeKind; text: string };

const GLYPH: Record<NoticeKind, string> = { ok: "✓", error: "!", info: "·" };
const TONE = { ok: TONE_TEXT.ok, error: TONE_TEXT.danger, info: TONE_TEXT.neutral } as const;

export default function Notice({ notice }: { notice: NoticeState | null }) {
  if (!notice) return null;

  return (
    <p className={`flex items-start gap-1.5 text-meta ${TONE[notice.kind]}`} role="status">
      <span aria-hidden className="font-semibold">
        {GLYPH[notice.kind]}
      </span>
      {notice.text}
    </p>
  );
}
