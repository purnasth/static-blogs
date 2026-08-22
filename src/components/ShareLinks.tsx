"use client";

import { Check, Link2, Share2 } from "lucide-react";
import type { IconType } from "react-icons";
import { FaThreads, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { LiaLinkedinIn, LiaFacebookF } from "react-icons/lia";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Share buttons: plain intent URLs, no third-party SDKs.
 *
 * Every network below is a link. Dropping in Facebook's or X's official widget
 * would mean a cross-origin script on every post, a tracking pixel for readers
 * who never click, and a `_headers` CSP exemption to let it load — for a button
 * that a 200-byte anchor does just as well.
 *
 * The URL is passed in from the server, built from `site.url`, rather than read
 * off `window.location`. That way it is the canonical address even if someone
 * arrives with tracking parameters stapled to it, and it is correct on the very
 * first render instead of after hydration.
 *
 * Brand marks come from `react-icons/fa6`. Lucide has no brand icons at all —
 * it removed them at v1, and none of its 1777 exports is a social mark — so a
 * separate set is the only way to show real logos. Font Awesome 6 is the pack
 * here because it is the one that carries all five in a single consistent
 * design: Simple Icons has dropped LinkedIn, and Ant Design's outline variants
 * have no Threads.
 *
 * These are SOLID, unlike every other icon on the page. That is not an
 * oversight — brand guidelines specify solid marks, so no maintained set ships
 * outline logos, and matching the page would have meant drawing them by hand.
 */

type Target = {
  id: string;
  label: string;
  /**
   * URL only — never the title. Every one of these platforms unfurls the link
   * into a preview card built from the post's own `og:` tags, so putting the
   * title in the text too makes it appear twice: once as typed text, once in
   * the card right beneath it. The metadata is there to carry the title; the
   * text box should be left empty for whatever the sharer wants to say.
   */
  href: (url: string) => string;
  Icon: IconType;
};

const e = encodeURIComponent;

const TARGETS: Target[] = [
  {
    id: "x",
    label: "X",
    href: (url) => `https://x.com/intent/post?url=${e(url)}`,
    Icon: FaXTwitter,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`,
    Icon: LiaLinkedinIn,
  },
  {
    id: "facebook",
    label: "Facebook",
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
    Icon: LiaFacebookF,
  },
  {
    id: "threads",
    label: "Threads",
    // `url` attaches the link as a card; `text` would also paste it into the
    // composer body, which is the duplication this whole row keeps avoiding.
    href: (url) => `https://www.threads.net/intent/post?url=${e(url)}`,
    Icon: FaThreads,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: (url) => `https://wa.me/?text=${e(url)}`,
    Icon: FaWhatsapp,
  },
];

/**
 * Whether the platform offers a native share sheet. It is external, read-only
 * state that never changes for the life of the page, so it is read rather than
 * mirrored into React — the same way `ThemeToggle` reads the theme.
 */
const subscribeNever = () => () => {};
const hasShareSheet = () =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";
/** The server has no navigator, and the first client render must agree. */
const noShareSheet = () => false;

const PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1 text-micro text-muted transition-colors hover:border-line-strong hover:text-foreground";

export default function ShareLinks({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">(
    "idle",
  );
  const canShare = useSyncExternalStore(
    subscribeNever,
    hasShareSheet,
    noShareSheet,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  /**
   * The async Clipboard API needs a secure context and an un-blocked
   * permission, so it can genuinely fail. `execCommand` is deprecated but has
   * neither requirement, which makes it the right fallback rather than a
   * legacy wart — and if both fail the button says so instead of looking
   * broken.
   */
  async function copy() {
    let ok = false;

    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      try {
        const field = document.createElement("textarea");
        field.value = url;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.append(field);
        field.select();
        ok = document.execCommand("copy");
        field.remove();
      } catch {
        ok = false;
      }
    }

    setCopyState(ok ? "done" : "failed");
    timer.current = setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <section
      aria-label="Share this post"
      className="mt-5 flex flex-wrap items-center gap-1 md:gap-2"
    >
      <h2 className="eyebrow mr-1 uppercase">Share: </h2>

      {TARGETS.map((target) => (
        <a
          key={target.id}
          href={target.href(url)}
          target="_blank"
          // noopener/noreferrer for the tab-hijack and referrer leak; nofollow
          // because an intent URL is a share action, not an endorsement.
          rel="noopener noreferrer nofollow"
          className={PILL}
          title={`Share on ${target.label}`}
        >
          <target.Icon aria-hidden className="size-3 shrink-0" />
          <span className="sr-only sm:not-sr-only text-xxs">{target.label}</span>
        </a>
      ))}

      <button type="button" onClick={copy} className={PILL}>
        {copyState === "done" ? (
          <Check
            aria-hidden
            className="size-3.5 shrink-0 text-ok"
            strokeWidth={1.5}
          />
        ) : (
          <Link2 aria-hidden className="size-3.5 shrink-0" strokeWidth={1.5} />
        )}
        <span aria-live="polite">
          {copyState === "done"
            ? "Copied"
            : copyState === "failed"
              ? "Press ⌘C"
              : "Copy link"}
        </span>
      </button>

      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url }).catch(() => {})}
          className={PILL}
        >
          <Share2 aria-hidden className="size-3 shrink-0" strokeWidth={1.5} />
          More
        </button>
      )}
    </section>
  );
}
