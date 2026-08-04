import fs from "node:fs";
import path from "node:path";
import { renderMarkdown } from "@/lib/markdown";

export const metadata = { title: "About" };

const ABOUT_FILE = path.join(process.cwd(), "content", "about.md");

export default async function AboutPage() {
  const markdown = fs.existsSync(ABOUT_FILE)
    ? fs.readFileSync(ABOUT_FILE, "utf8")
    : "# About\n\nEdit `content/about.md` to change this page.";
  const html = await renderMarkdown(markdown);

  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}
