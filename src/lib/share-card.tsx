import fs from "node:fs";
import path from "node:path";

/* ---------------------------------------------------------------------------
 * The 1200×630 image Slack, X, LinkedIn, WhatsApp, iMessage, Discord and
 * Facebook render when someone shares a link.
 *
 * Drawn at build time by `next/og`, so the deployed site stays a pure static
 * export — each card ends up as a plain .png in `out/`.
 *
 * Satori (what next/og draws with) implements a deliberate subset of CSS:
 * flexbox only, and every element with more than one child needs an explicit
 * `display: flex`. Text is clamped in JavaScript rather than with line-clamp,
 * so a long title wraps to a predictable number of lines.
 * ------------------------------------------------------------------------- */

export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;
export const SHARE_CARD_CONTENT_TYPE = "image/png";

/** Dark card: it reads well against both light and dark social UIs. */
const COLORS = {
  bg: "#101010",
  surface: "#191817",
  line: "#2c2a28",
  text: "#f6f4f1",
  muted: "#a29a92",
  /** --brand lifted for a dark background, matching --brand-on-dark. */
  accent: "#e0714a",
};

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

/**
 * Turns a post's `cover` into something satori can draw, always as a data URI.
 *
 * A local cover is read off disk. A remote one is fetched here rather than
 * handed to satori as a URL, because a fetch satori performs internally throws
 * straight through ImageResponse and fails the build — a cover that has moved
 * should cost that card its artwork, not the deploy. Any failure resolves to
 * undefined and the card falls back to its text-only layout.
 */
export async function loadCoverArt(cover?: string): Promise<string | undefined> {
  if (!cover) return undefined;

  if (/^https?:\/\//i.test(cover)) {
    try {
      const response = await fetch(cover, { signal: AbortSignal.timeout(10_000) });
      const mime = response.headers.get("content-type")?.split(";")[0].trim();
      if (!response.ok || !mime?.startsWith("image/")) return undefined;
      return `data:${mime};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
    } catch {
      return undefined;
    }
  }

  try {
    const file = path.join(process.cwd(), "public", cover.replace(/^\//, ""));
    const mime = MIME_BY_EXT[path.extname(file).toLowerCase()];
    if (!mime || !fs.existsSync(file)) return undefined;
    return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
  } catch {
    return undefined;
  }
}

/** Cuts on a word boundary and appends an ellipsis, so lines never run off. */
function clamp(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

/** Long titles get smaller type rather than more lines. */
function titleSize(length: number): number {
  if (length <= 38) return 68;
  if (length <= 72) return 56;
  if (length <= 110) return 46;
  return 40;
}

export type ShareCardProps = {
  /** Small uppercase label, top left. */
  eyebrow: string;
  /** Small label, top right. Usually the date. */
  aside?: string;
  title: string;
  description?: string;
  /** Data URI from `loadCoverArt`. */
  art?: string;
  footerLeft?: string;
  footerRight?: string;
};

export function ShareCard({
  eyebrow,
  aside,
  title,
  description,
  art,
  footerLeft,
  footerRight,
}: ShareCardProps) {
  // With art beside it the text column is narrower, so it holds fewer glyphs.
  const clampedTitle = clamp(title, art ? 96 : 130);
  const clampedDescription = description ? clamp(description, art ? 104 : 190) : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.bg,
        color: COLORS.text,
      }}
    >
      {/* Brand rule across the top — the one flash of colour on the card. */}
      <div style={{ display: "flex", height: 10, width: "100%", backgroundColor: COLORS.accent }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "48px 64px 44px 64px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: COLORS.accent,
            }}
          >
            {eyebrow}
          </div>
          {aside ? (
            <div style={{ display: "flex", fontSize: 22, color: COLORS.muted }}>{aside}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 48, flex: 1, paddingTop: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                fontSize: titleSize(clampedTitle.length),
                lineHeight: 1.12,
                letterSpacing: -1,
              }}
            >
              {clampedTitle}
            </div>
            {clampedDescription ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 22,
                  fontSize: 26,
                  lineHeight: 1.4,
                  color: COLORS.muted,
                }}
              >
                {clampedDescription}
              </div>
            ) : null}
          </div>

          {art ? (
            <div
              style={{
                display: "flex",
                width: 320,
                height: 320,
                flexShrink: 0,
                borderRadius: 24,
                border: `1px solid ${COLORS.line}`,
                backgroundColor: COLORS.surface,
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art} alt="" width={320} height={320} style={{ objectFit: "cover" }} />
            </div>
          ) : null}
        </div>

        {footerLeft || footerRight ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 32,
              paddingTop: 24,
              borderTop: `1px solid ${COLORS.line}`,
              fontSize: 22,
              color: COLORS.muted,
            }}
          >
            <div style={{ display: "flex" }}>{footerLeft ? clamp(footerLeft, 60) : ""}</div>
            <div style={{ display: "flex" }}>{footerRight ?? ""}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
