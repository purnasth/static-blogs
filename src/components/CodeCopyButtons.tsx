"use client";

import { useEffect } from "react";

/**
 * A copy button on every fenced code block.
 *
 * The article body arrives as an HTML string from the markdown pipeline, so
 * there is no React tree to hang a button off. Injecting after mount keeps the
 * whole feature in one file and leaves `markdown.ts` alone — and because the
 * button is absolutely positioned, adding it shifts nothing.
 *
 * Rendered once per post; it draws nothing itself.
 */
export default function CodeCopyButtons() {
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>(".prose pre"));
    const undo: (() => void)[] = [];

    for (const block of blocks) {
      const code = block.querySelector("code")?.textContent;
      if (!code) continue;

      block.classList.add("group/code", "relative");

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Copy";
      button.className =
        "absolute right-2 top-2 rounded-md border border-line bg-raised px-2 py-1 text-micro text-muted opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/code:opacity-100";

      let timer: ReturnType<typeof setTimeout>;
      const onClick = async () => {
        let ok = false;
        try {
          await navigator.clipboard.writeText(code);
          ok = true;
        } catch {
          ok = false;
        }
        // Same reasoning as ShareLinks: say what happened rather than nothing.
        button.textContent = ok ? "Copied" : "Press ⌘C";
        clearTimeout(timer);
        timer = setTimeout(() => {
          button.textContent = "Copy";
        }, 2000);
      };

      button.addEventListener("click", onClick);
      block.append(button);

      undo.push(() => {
        clearTimeout(timer);
        button.removeEventListener("click", onClick);
        button.remove();
      });
    }

    return () => undo.forEach((fn) => fn());
  }, []);

  return null;
}
