import { NextResponse } from "next/server";
import { getStore, slugify } from "@/lib/storage";
import type { PostFrontmatter } from "@/lib/types";

/** Dev-only: this file is excluded from the production build (see next.config.ts). */

function parseFrontmatter(input: Record<string, unknown>): PostFrontmatter {
  const title = String(input.title ?? "").trim();
  if (!title) throw new Error("Title is required.");

  const date = String(input.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Date must be YYYY-MM-DD.");

  return {
    title,
    date,
    summary: String(input.summary ?? "").trim(),
    tags: Array.isArray(input.tags)
      ? [...new Set(input.tags.map((t) => String(t).trim()).filter(Boolean))]
      : [],
    cover: input.cover ? String(input.cover) : undefined,
    draft: input.draft !== false,
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const frontmatter = parseFrontmatter(payload);

    const slug = slugify(String(payload.slug ?? "") || frontmatter.title);
    if (!slug) throw new Error("Could not derive a slug — give the post a title with letters or numbers.");

    const previousSlug = payload.previousSlug ? String(payload.previousSlug) : undefined;
    const store = await getStore();
    const saved = await store.save({
      slug,
      previousSlug,
      frontmatter,
      body: String(payload.body ?? ""),
    });

    return NextResponse.json({ ok: true, ...saved });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Save failed." },
      { status: 400 },
    );
  }
}
