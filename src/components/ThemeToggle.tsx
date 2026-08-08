"use client";

import { useSyncExternalStore } from "react";
import SegmentedControl, { type Segment } from "@/components/ui/SegmentedControl";
import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY } from "@/lib/constants";
import { Theme } from "@/lib/enums";

/**
 * Runs before first paint to stop a light flash on a dark-themed reload. Kept
 * as a string so it can be inlined into <head> — it must execute before React
 * hydrates. Writing `data-theme` is all it does; globals.css maps that to
 * `color-scheme`, and every token resolves through light-dark() from there.
 */
export const themeInitScript = `
try {
  var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
`;

/** Theme is external state (DOM + storage), so it is read rather than mirrored. */
function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  const value = document.documentElement.dataset.theme;
  return value === Theme.Light || value === Theme.Dark ? value : Theme.System;
}

/** The server has no DOM and no storage, so it always renders "system". */
const getServerSnapshot = (): Theme => Theme.System;

function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === Theme.System) delete root.dataset.theme;
  else root.dataset.theme = theme;

  try {
    if (theme === Theme.System) localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the choice still applies here.
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

const SEGMENTS: readonly Segment<Theme>[] = [
  { value: Theme.System, label: <AutoIcon />, title: "Match system" },
  { value: Theme.Light, label: <SunIcon />, title: "Light" },
  { value: Theme.Dark, label: <MoonIcon />, title: "Dark" },
];

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <SegmentedControl
      value={theme}
      onChange={setTheme}
      segments={SEGMENTS}
      label="Colour theme"
    />
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function SunIcon() {
  return (
    <Icon>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1.2M8 13.3v1.2M14.5 8h-1.2M2.7 8H1.5M12.6 3.4l-.85.85M4.25 11.75l-.85.85M12.6 12.6l-.85-.85M4.25 4.25l-.85-.85" />
    </Icon>
  );
}

function MoonIcon() {
  return (
    <Icon>
      <path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1Z" />
    </Icon>
  );
}

function AutoIcon() {
  return (
    <Icon>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 2.5v11a5.5 5.5 0 0 0 0-11Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}
