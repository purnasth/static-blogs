/**
 * Structured facts for the About page. Kept out of `content/about.md` because
 * a timeline and skill groups render from data far better than from prose —
 * the markdown file stays the narrative voice.
 */

export type ProfileLink = {
  label: string;
  href: string;
  handle: string;
};

export type Role = {
  title: string;
  company: string;
  href?: string;
  start: string;
  end: string | null;
};

export type SkillGroup = {
  label: string;
  items: readonly string[];
};

export const profile = {
  name: "Purna Shrestha",
  role: "Software Engineer",
  tagline:
    "Software engineer helping brands build globally through design and code; crafting digital experiences that are both beautiful and functional.",
  avatar: "/images/purna.svg",
  portfolio: "https://www.purnashrestha.com.np/",
  availableForWork: true,
} as const;

export const links: readonly ProfileLink[] = [
  {
    label: "Portfolio",
    href: "https://www.purnashrestha.com.np/",
    handle: "www.purnashrestha.com.np",
  },
];

/** Newest first. `end: null` means the role is current. */
export const experience: readonly Role[] = [
  {
    title: "Software Engineer",
    company: "Leapfrog Technology",
    href: "https://www.lftechnology.com/",
    start: "March 2026",
    end: null,
  },
  {
    title: "Associate Software Engineer",
    company: "Leapfrog Technology",
    href: "https://www.lftechnology.com/",
    start: "March 2025",
    end: "March 2026",
  },
  {
    title: "React Developer",
    company: "Longtail e-Media",
    href: "https://longtail.info/",
    start: "November 2023",
    end: "March 2025",
  },
  {
    title: "Leapfrog Student Partnership Program",
    company: "Leapfrog Technology",
    href: "https://www.lftechnology.com/",
    start: "April 2023",
    end: "December 2023",
  },
];

export const skills: readonly SkillGroup[] = [
  {
    label: "Front-end",
    items: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "React",
      "Next.js",
      "Tailwind CSS",
      "Bootstrap",
    ],
  },
  {
    label: "Back-end",
    items: [
      "Node.js",
      "Express.js",
      "MongoDB",
      "MySQL",
      "Firebase",
      "Python",
      "Django",
    ],
  },
  {
    label: "Design",
    items: [
      "Figma",
      "Adobe XD",
      "Photoshop",
      "Illustrator",
      "InDesign",
      "After Effects",
    ],
  },
  {
    label: "Tooling",
    items: ["Git", "GitHub", "Cloudflare", "Jira", "Notion", "Slack"],
  },
];

/** Selected client work, with the outcome each project reported. */
export const selectedWork = [
  {
    name: "Satprayas Nepal",
    note: "Non-profit supporting physically and mentally challenged children in Bhaktapur.",
    outcome:
      "50% more donations, 30% more volunteer sign-ups in the first month",
  },
  {
    name: "Hotel Himalaya",
    note: "Website redesign for one of Kathmandu's long-standing hotels.",
    outcome: "80% more visitors, 30% more engagement, 20% more bookings",
  },
  {
    name: "Baber Mahal Vilas",
    note: "Heritage property blending modern luxury with traditional architecture.",
    outcome: "50% more traffic, 30% more direct bookings",
  },
  {
    name: "Himalayan Flavours",
    note: "Himalayan restaurant in Victoria, British Columbia.",
    outcome: "80% more visitors, 40% more online orders",
  },
] as const;
