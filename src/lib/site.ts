import { IS_DEV } from "@/lib/constants";

export type NavItem = {
  href: string;
  label: string;
  /** Opens in a new tab and is excluded from the production build. */
  devOnly?: boolean;
};

/** Edit these once — they feed the header, footer, page titles and RSS feed. */
export const site = {
  title: "Pages by Purna",
  headline: {
    lead: "Thoughts, experiences and",
    accent: "lessons",
    trail: "worth writing down.",
  },
  intro:
    "A personal corner of the internet where I write about technology, design and the small hops that quietly turn into a journey — in the hope that some of it proves useful to you too.",
  description:
    "Thoughts, experiences and lessons worth writing down — Purna Shrestha on technology, design, and the small hops that turn into a journey.",
  author: "Purna Shrestha",
  url: "https://blogs.purnashrestha.com.np",
  nav: [
    { href: "/", label: "Posts" },
    { href: "/tags/", label: "Tags" },
    { href: "/about/", label: "About" },
    { href: "/admin/", label: "Write", devOnly: true },
  ] satisfies NavItem[] as NavItem[],
};

/**
 * Where a reader can follow along, shown at the end of every post. The RSS feed
 * is always offered; these are additions.
 *
 * Deliberately empty rather than guessed — fill in your own profiles. This is
 * the cheap half of "how does someone hear about the next post"; an email list
 * is the expensive half, and it is a promise to actually send emails.
 */
export const follow: NavItem[] = [
  // { href: "https://x.com/yourhandle", label: "X" },
  // { href: "https://www.linkedin.com/in/yourhandle/", label: "LinkedIn" },
];

/** The writing desk exists only under `next dev`, so its link must too. */
export const navItems = site.nav.filter((item) => IS_DEV || !item.devOnly);

/**
 * Site-relative path -> absolute URL. RSS items, sitemap entries and feed
 * enclosures must all be absolute, and all three should agree on the origin.
 */
export function absoluteUrl(path: string): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
