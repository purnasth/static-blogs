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
  description:
    "Pages by Purna is a blogs platform through which I share my thoughts, experiences, and insights on various topics. It serves as a personal space for me to express myself and connect with like-minded individuals. Be it technology, lifestyle, or any other subject that piques my interest, I aim to provide valuable content that informs, inspires, and sparks meaningful conversations. Join me on this journey as I explore the world through my words and share my unique perspective with you.",
  author: "Purna Shrestha",
  // Set this to your real domain before deploying; used for absolute URLs in RSS.
  url: "https://example.com",
  nav: [
    { href: "/", label: "Posts" },
    { href: "/tags/", label: "Tags" },
    { href: "/about/", label: "About" },
    { href: "/admin/", label: "Write", devOnly: true },
  ] satisfies NavItem[] as NavItem[],
};

/** The writing desk exists only under `next dev`, so its link must too. */
export const navItems = site.nav.filter((item) => IS_DEV || !item.devOnly);
