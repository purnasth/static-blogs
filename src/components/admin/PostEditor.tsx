"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import type { Post } from "@/lib/types";

type Draft = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string;
  cover: string;
  draft: boolean;
  body: string;
};

function toDraft(post: Post | null, today: string): Draft {
  if (!post) {
    return { slug: "", title: "", date: today, summary: "", tags: "", cover: "", draft: true, body: "" };
  }
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    summary: post.summary,
    tags: post.tags.join(", "),
    cover: post.cover ?? "",
    draft: post.draft,
    body: post.body,
  };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function PostEditor({ post, today }: { post: Post | null; today: string }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Once the slug has been set by hand (or loaded from a saved post), stop
  // regenerating it from the title — renaming a live post breaks its URL.
  const slugTouched = useRef(post !== null);

  const [draft, setDraft] = useState<Draft>(() => toDraft(post, today));
  const [savedSlug, setSavedSlug] = useState<string | null>(post?.slug ?? null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const save = useCallback(async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/posts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: draft.slug || slugify(draft.title),
          previousSlug: savedSlug ?? undefined,
          title: draft.title,
          date: draft.date,
          summary: draft.summary,
          tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
          cover: draft.cover || undefined,
          draft: draft.draft,
          body: draft.body,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      setSavedSlug(data.slug);
      slugTouched.current = true;
      setNotice({ kind: "ok", text: "Saved to disk." });
      if (data.slug !== post?.slug) router.replace(`/admin/edit/${data.slug}/`);
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Save failed." });
    } finally {
      setBusy(false);
    }
  }, [draft, savedSlug, post, router]);

  // Cmd/Ctrl+S saves.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    setDraft((current) => ({
      ...current,
      body: current.body.slice(0, start) + text + current.body.slice(end),
    }));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  }

  function wrapSelection(before: string, after = before) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = draft.body.slice(start, end);
    update({
      body: draft.body.slice(0, start) + before + selected + after + draft.body.slice(end),
    });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    });
  }

  async function uploadFiles(files: FileList | File[]) {
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setBusy(true);
    try {
      for (const file of images) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/images/", { method: "POST", body: form });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        insertAtCursor(`\n![${file.name.replace(/\.[^.]+$/, "")}](${data.url})\n`);
      }
      setNotice({ kind: "ok", text: `Added ${images.length} image(s) to /public/images.` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!savedSlug) return;
    if (!window.confirm(`Delete “${draft.title}”? This removes the file from disk.`)) return;
    setBusy(true);
    const res = await fetch(`/api/posts/${savedSlug}/`, { method: "DELETE" });
    const data = await res.json();
    setBusy(false);
    if (data.ok) router.push("/admin/");
    else setNotice({ kind: "error", text: data.error });
  }

  const effectiveSlug = draft.slug || slugify(draft.title) || "untitled";

  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        uploadFiles(e.dataTransfer.files);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{post ? "Edit post" : "New post"}</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5 text-muted">
            <input
              type="checkbox"
              checked={draft.draft}
              onChange={(e) => update({ draft: e.target.checked })}
            />
            Draft
          </label>
          {savedSlug && (
            <button onClick={remove} disabled={busy} className="px-2 py-1 text-muted hover:text-accent">
              Delete
            </button>
          )}
          <button
            onClick={save}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-1.5 font-medium text-white disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-line p-4">
        <input
          value={draft.title}
          onChange={(e) => {
            const title = e.target.value;
            update(slugTouched.current ? { title } : { title, slug: slugify(title) });
          }}
          placeholder="Title"
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted/50"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Slug">
            <input
              value={draft.slug}
              onChange={(e) => {
                slugTouched.current = true;
                update({ slug: slugify(e.target.value) });
              }}
              placeholder={effectiveSlug}
              className={inputClass}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => update({ date: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Tags (comma separated)">
            <input
              value={draft.tags}
              onChange={(e) => update({ tags: e.target.value })}
              placeholder="photography, nepal"
              className={inputClass}
            />
          </Field>
          <Field label="Cover image path">
            <input
              value={draft.cover}
              onChange={(e) => update({ cover: e.target.value })}
              placeholder="/images/cover.jpg"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Summary">
          <input
            value={draft.summary}
            onChange={(e) => update({ summary: e.target.value })}
            placeholder="One line shown on the home page"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 text-sm">
        <ToolbarButton onClick={() => wrapSelection("**")}>B</ToolbarButton>
        <ToolbarButton onClick={() => wrapSelection("_")}>i</ToolbarButton>
        <ToolbarButton onClick={() => insertAtCursor("\n## ")}>H2</ToolbarButton>
        <ToolbarButton onClick={() => wrapSelection("[", "](https://)")}>link</ToolbarButton>
        <ToolbarButton onClick={() => wrapSelection("`")}>code</ToolbarButton>
        <ToolbarButton onClick={() => insertAtCursor("\n> ")}>quote</ToolbarButton>
        <ToolbarButton onClick={() => insertAtCursor("\n- ")}>list</ToolbarButton>
        <label className="cursor-pointer rounded border border-line px-2 py-1 hover:border-accent">
          image
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </label>
        <button
          onClick={() => setPreview((p) => !p)}
          className="ml-auto rounded border border-line px-2 py-1 hover:border-accent"
        >
          {preview ? "Write" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div
          className="prose mt-3 min-h-[26rem] max-w-none rounded-lg border border-line p-4"
          dangerouslySetInnerHTML={{ __html: marked.parse(draft.body) as string }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={draft.body}
          onChange={(e) => update({ body: e.target.value })}
          onPaste={(e) => {
            const files = [...e.clipboardData.files];
            if (files.length > 0) {
              e.preventDefault();
              uploadFiles(files);
            }
          }}
          placeholder="Write in markdown. Drag images straight in."
          spellCheck
          className="mt-3 min-h-[26rem] w-full resize-y rounded-lg border border-line bg-transparent p-4 font-mono text-sm leading-relaxed outline-none focus:border-accent"
        />
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">
          {savedSlug ? (
            <>
              Saved as <span className="font-mono">content/posts/{savedSlug}.md</span>
            </>
          ) : (
            "Not saved yet"
          )}
        </span>
        {notice && (
          <span className={notice.kind === "ok" ? "text-muted" : "text-accent"}>{notice.text}</span>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-transparent px-3 py-1.5 text-sm outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

function ToolbarButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded border border-line px-2 py-1 hover:border-accent">
      {children}
    </button>
  );
}
