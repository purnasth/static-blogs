import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import matter from "gray-matter";
import { getAllPosts, POSTS_DIR, readPostFile } from "@/lib/posts";
import type { PostStore, PublishStatus, SaveInput } from "@/lib/storage";
import type { Post } from "@/lib/types";

const run = promisify(execFile);
const ROOT = process.cwd();
const IMAGES_DIR = path.join(ROOT, "public", "images");

async function gitRaw(...args: string[]): Promise<string> {
  const { stdout } = await run("git", args, { cwd: ROOT });
  return stdout;
}

async function git(...args: string[]): Promise<string> {
  return (await gitRaw(...args)).trim();
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function assertSafeSlug(slug: string) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`Invalid slug: ${slug}`);
  }
}

/** Serialise frontmatter + body back to a .md file. */
function serialise({ frontmatter, body }: SaveInput): string {
  const data: Record<string, unknown> = {
    title: frontmatter.title,
    date: frontmatter.date,
    summary: frontmatter.summary,
    tags: frontmatter.tags,
    draft: frontmatter.draft,
  };
  if (frontmatter.cover) data.cover = frontmatter.cover;
  return matter.stringify(body.trim() + "\n", data);
}

export const localStore: PostStore = {
  kind: "local",

  async list(): Promise<Post[]> {
    return getAllPosts();
  },

  async get(slug: string): Promise<Post | null> {
    assertSafeSlug(slug);
    return readPostFile(slug);
  },

  async save(input: SaveInput) {
    assertSafeSlug(input.slug);
    await fs.mkdir(POSTS_DIR, { recursive: true });

    if (input.previousSlug && input.previousSlug !== input.slug) {
      assertSafeSlug(input.previousSlug);
      // Refuse to clobber a different existing post via a rename.
      if (await exists(path.join(POSTS_DIR, `${input.slug}.md`))) {
        throw new Error(`A post named "${input.slug}" already exists.`);
      }
      await fs.rm(path.join(POSTS_DIR, `${input.previousSlug}.md`), { force: true });
    }

    await fs.writeFile(path.join(POSTS_DIR, `${input.slug}.md`), serialise(input), "utf8");
    return { slug: input.slug };
  },

  async remove(slug: string) {
    assertSafeSlug(slug);
    await fs.rm(path.join(POSTS_DIR, `${slug}.md`), { force: true });
  },

  async saveImage(filename: string, data: Buffer) {
    const ext = path.extname(filename).toLowerCase();
    if (!/^\.(png|jpe?g|gif|webp|avif|svg)$/.test(ext)) {
      throw new Error(`Unsupported image type: ${ext || "(none)"}`);
    }
    const base =
      path
        .basename(filename, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "image";

    await fs.mkdir(IMAGES_DIR, { recursive: true });

    // Never overwrite an image another post might already reference.
    let name = `${base}${ext}`;
    for (let i = 2; await exists(path.join(IMAGES_DIR, name)); i++) {
      name = `${base}-${i}${ext}`;
    }

    await fs.writeFile(path.join(IMAGES_DIR, name), data);
    return { url: `/images/${name}` };
  },

  async status(): Promise<PublishStatus> {
    const branch = await git("rev-parse", "--abbrev-ref", "HEAD").catch(() => "unknown");
    const remote = await git("remote", "get-url", "origin").catch(() => null);
    // Not trimmed: porcelain lines start with a two-character status field that
    // is often " M", and trimming would eat the leading space of the first line.
    const porcelain = await gitRaw("status", "--porcelain").catch(() => "");
    const dirty = porcelain
      .split("\n")
      .map((line) => line.replace(/^.{2}\s/, "").trim())
      .filter(Boolean);
    return { branch, remote, dirty };
  },

  async publish(message: string) {
    const { branch, remote, dirty } = await this.status();
    if (dirty.length === 0) {
      return { pushed: false, detail: "Nothing to publish — no changes since the last commit." };
    }

    await git("add", "-A");
    await git("commit", "-m", message || "Update posts");

    if (!remote) {
      return {
        pushed: false,
        detail: "Committed locally. Add a git remote (`git remote add origin …`) to push and deploy.",
      };
    }

    await git("push", "origin", branch);
    return { pushed: true, detail: `Pushed ${dirty.length} change(s) to ${branch}. Cloudflare Pages will rebuild.` };
  },
};
