import fs from "node:fs";
import path from "node:path";
// import { Badge, MetaRow, Panel } from "@/components/ui";
import { getCurrentRoles, getTotalExperience } from "@/lib/experience";
import { renderMarkdown } from "@/lib/markdown";
import {
  experience,
  links,
  profile,
  // selectedWork,
  // skills,
} from "@/lib/profile";

export const metadata = {
  title: "About",
  description: profile.tagline,
  openGraph: { title: `About ${profile.name}`, images: [profile.avatar] },
};

const ABOUT_FILE = path.join(process.cwd(), "content", "about.md");

const FALLBACK = "Edit `content/about.md` to change this page.";

export default async function AboutPage() {
  const markdown = fs.existsSync(ABOUT_FILE)
    ? fs.readFileSync(ABOUT_FILE, "utf8")
    : FALLBACK;
  const { html } = await renderMarkdown(markdown);

  // The full history stays in profile.ts so the total stays accurate; this page
  // only shows what Purna is doing now.
  const currentRoles = getCurrentRoles(experience);
  const totalExperience = getTotalExperience(experience);

  return (
    <div>
      <header className="border-b border-line pb-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatar}
            alt={`Portrait of ${profile.name}`}
            width={1024}
            height={1024}
            className="size-24 shrink-0 border border-line object-cover shadow-sm sm:size-48"
          />

          <div className="min-w-0">
            <h1 className="text-balance text-display font-semibold">
              {profile.name}
            </h1>

            <p className="mt-4 text-pretty text-base text-muted">
              {profile.tagline}
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-5">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={
                      link.href.startsWith("mailto:") ? undefined : "_blank"
                    }
                    rel="noreferrer"
                    className="group inline-flex items-baseline gap-1.5 text-meta"
                  >
                    <span className="text-muted transition-colors group-hover:text-foreground">
                      {link.label}
                    </span>
                    <span className="font-mono text-accent transition-colors group-hover:text-accent-hover">
                      {link.handle}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <div
        className="prose mt-10 max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {currentRoles.length > 0 && (
        <section className="mt-14">
          <h2 className="eyebrow mb-5">
            Currently
            {totalExperience && (
              <span className="ml-1.5 normal-case tracking-normal text-muted">
                ({totalExperience} in the industry)
              </span>
            )}
          </h2>

          <ul className="space-y-3">
            {currentRoles.map((role) => (
              <li
                key={`${role.company}-${role.start}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
              >
                <p className="flex items-baseline gap-2 font-medium">
                  <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-accent" />
                  {role.title}
                  <span className="font-normal text-muted">at</span>
                  {role.href ? (
                    <a
                      href={role.href}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-accent"
                    >
                      {role.company}
                    </a>
                  ) : (
                    role.company
                  )}
                </p>
                <p className="meta shrink-0 tabular-nums">Since {role.start}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* <section className="mt-14">
        <h2 className="eyebrow mb-5">Selected work</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {selectedWork.map((project) => (
            <Panel key={project.name} className="p-4">
              <p className="font-medium">{project.name}</p>
              <p className="mt-1 text-meta text-muted">{project.note}</p>
              <p className="mt-2.5 text-meta text-ok">{project.outcome}</p>
            </Panel>
          ))}
        </div>
        <p className="meta mt-3">
          More case studies at{" "}
          <a
            href={profile.portfolio}
            target="_blank"
            rel="noreferrer"
            className="text-accent transition-colors hover:text-accent-hover"
          >
            purnashrestha.com.np
          </a>
        </p>
      </section> */}

      {/* <section className="mt-14">
        <h2 className="eyebrow mb-5">Toolkit</h2>
        <dl className="space-y-4">
          {skills.map((group) => (
            <div
              key={group.label}
              className="flex flex-col gap-2 sm:flex-row sm:gap-5"
            >
              <dt className="meta w-28 shrink-0 pt-0.5">{group.label}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-line bg-raised px-2.5 py-0.5 text-meta text-muted"
                  >
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section> */}
    </div>
  );
}
