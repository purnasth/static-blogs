import { IS_DEV } from "@/lib/constants";

export type NavItem = {
  href: string;
  label: string;
  /** Opens in a new tab and is excluded from the production build. */
  devOnly?: boolean;
};

/** Edit these once — they feed the header, footer, page titles and RSS feed. */
export const site = {
  title: "Purna Shrestha",
  description: "Writing, notes and photographs.",
  author: "Purna Shrestha",
  /**
   * Canonical origin, no trailing slash. Every absolute URL on the site is
   * derived from it: canonical tags, og:url, share cards, RSS and the sitemap.
   */
  url: "https://blogs.purnashrestha.com.np",

  /**
   * The home page's <title> and meta description. Separate from `description`
   * above, which is the one-liner printed under the heading: a search result
   * for the home page has to explain the whole site, and "Writing, notes and
   * photographs." on its own tells someone nothing about what is here.
   */
  homeTitle: "Purna Shrestha — Software engineer, writing about code and craft",
  metaDescription:
    "Purna Shrestha writes about software engineering, design, open source and learning in public — from student partner to Leapfrogger, one commit at a time.",

  nav: [
    { href: "/", label: "Posts" },
    { href: "/tags/", label: "Tags" },
    { href: "/about/", label: "About" },
    { href: "/admin/", label: "Write", devOnly: true },
  ] satisfies NavItem[] as NavItem[],
};

/** The writing desk exists only under `next dev`, so its link must too. */
export const navItems = site.nav.filter((item) => IS_DEV || !item.devOnly);
