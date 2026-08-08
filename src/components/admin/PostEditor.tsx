"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import EditorToolbar from "@/components/admin/EditorToolbar";
import MarkdownEditor, { type MarkdownEditorHandle } from "@/components/admin/MarkdownEditor";
import MetaPanel, { type Meta } from "@/components/admin/MetaPanel";
import {
  Button,
  ConfirmDialog,
  MetaRow,
  Notice,
  SegmentedControl,
  StatusBadge,
  type NoticeState,
  type Segment,
} from "@/components/ui";
import {
  EDITOR_PANE_HEIGHT,
  EDITOR_PANE_HEIGHT_FOCUS,
  EDITOR_PANE_HEIGHT_LG,
  WORDS_PER_MINUTE,
} from "@/lib/constants";
import { EditorViewMode } from "@/lib/enums";
import { slugify } from "@/lib/slug";
import type { Post } from "@/lib/types";

type Draft = Meta & {
  title: string;
  draft: boolean;
  body: string;
};

const VIEWS: readonly Segment<EditorViewMode>[] = [
  { value: EditorViewMode.Write, label: "Write" },
  { value: EditorViewMode.Split, label: "Split", title: "Source and preview side by side", showFrom: "lg" },
  { value: EditorViewMode.Preview, label: "Preview", title: "Preview (⌘P)", showFrom: "sm" },
];

function toDraft(post: Post | null, today: string): Draft {
  return {
    slug: post?.slug ?? "",
    title: post?.title ?? "",
    date: post?.date ?? today,
    summary: post?.summary ?? "",
    tags: post?.tags ?? [],
    cover: post?.cover ?? "",
    draft: post?.draft ?? true,
    body: post?.body ?? "",
  };
}

export default function PostEditor({ post, today }: { post: Post | null; today: string }) {
  const router = useRouter();
  const editor = useRef<MarkdownEditorHandle>(null);
  // Once the slug has been set by hand (or loaded from a saved post), stop
  // regenerating it from the title — renaming a live post breaks its URL.
  const slugTouched = useRef(post !== null);

  const [draft, setDraft] = useState<Draft>(() => toDraft(post, today));
  const [saved, setSaved] = useState<Draft>(() => toDraft(post, today));
  const [savedSlug, setSavedSlug] = useState<string | null>(post?.slug ?? null);
  const [view, setView] = useState<EditorViewMode>(EditorViewMode.Write);
  const [focusMode, setFocusMode] = useState(false);
  const [metaOpen, setMetaOpen] = useState(post === null);
  const [dragging, setDragging] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const words = useMemo(() => (draft.body.trim().match(/\S+/g) ?? []).length, [draft.body]);
  const effectiveSlug = draft.slug || slugify(draft.title) || "untitled";

  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const save = useCallback(async () => {
    if (!draft.title.trim()) {
      setNotice({ kind: "error", text: "Give the post a title before saving." });
      setMetaOpen(true);
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/posts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          slug: draft.slug || slugify(draft.title),
          previousSlug: savedSlug ?? undefined,
          cover: draft.cover || undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      setSavedSlug(data.slug);
      setSaved(draft);
      slugTouched.current = true;
      setNotice({ kind: "ok", text: `Written to content/posts/${data.slug}.md` });
      if (data.slug !== post?.slug) router.replace(`/admin/edit/${data.slug}/`);
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Save failed." });
    } finally {
      setBusy(false);
    }
  }, [draft, savedSlug, post, router]);

  // Global shortcuts. ⌘S also fires from inside CodeMirror via its own keymap;
  // this covers the metadata fields and the preview pane.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      } else if (mod && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setView((v) => (v === EditorViewMode.Preview ? EditorViewMode.Write : EditorViewMode.Preview));
      } else if (event.key === "Escape" && focusMode) {
        setFocusMode(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, focusMode]);

  // Don't let unsaved work disappear on reload or tab close.
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setBusy(true);
    setNotice({ kind: "info", text: `Uploading ${images.length} image(s)…` });
    try {
      for (const file of images) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/images/", { method: "POST", body: form });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        editor.current?.insert(`\n![${file.name.replace(/\.[^.]+$/, "")}](${data.url})\n`);
      }
      setNotice({ kind: "ok", text: `Added ${images.length} image(s) to public/images/.` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setBusy(false);
    }
  }, []);

  async function remove() {
    if (!savedSlug) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${savedSlug}/`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      router.push("/admin/");
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Delete failed." });
      setBusy(false);
      setConfirmingDelete(false);
    }
  }

  const previewHtml = useMemo(
    () => (view === EditorViewMode.Write ? "" : (marked.parse(draft.body) as string)),
    [view, draft.body],
  );

  return (
    <div
      onDragEnter={(e) => {
        if (e.dataTransfer.types.includes("Files")) setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        uploadFiles(e.dataTransfer.files);
      }}
      className={focusMode ? "fixed inset-0 z-50 overflow-y-auto bg-background p-4 sm:p-8" : ""}
    >
      <div className={focusMode ? "mx-auto max-w-3xl" : ""}>
        <div
          className={`veil sticky z-20 -mx-1 mb-4 rounded-xl border border-line px-3 py-2.5 shadow-sm ${
            focusMode ? "top-0" : "top-14"
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {!focusMode && (
              <Link
                href="/admin/"
                className="shrink-0 rounded-md px-1.5 py-1 text-meta text-muted transition-colors hover:text-accent"
              >
                ← Posts
              </Link>
            )}

            <StatusBadge draft={draft.draft} />

            <MetaRow
              items={[
                <span key="state" className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${
                      dirty ? "bg-warn" : savedSlug ? "bg-ok" : "bg-line-strong"
                    }`}
                  />
                  {dirty ? "Unsaved changes" : savedSlug ? "Saved" : "New post"}
                </span>,
                <span key="count" className="tabular-nums">
                  {words.toLocaleString()} words · ~{Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min
                </span>,
              ]}
            />

            <div className="ml-auto flex items-center gap-1.5">
              <SegmentedControl value={view} onChange={setView} segments={VIEWS} label="View mode" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFocusMode((f) => !f)}
                title={focusMode ? "Exit focus mode (Esc)" : "Focus mode"}
              >
                {focusMode ? "Exit focus" : "Focus"}
              </Button>

              <label className="flex cursor-pointer select-none items-center gap-1.5 rounded-lg border border-line bg-raised px-2.5 py-1 text-meta font-medium transition-colors hover:border-line-strong">
                <input
                  type="checkbox"
                  checked={draft.draft}
                  onChange={(e) => update({ draft: e.target.checked })}
                  className="accent-accent"
                />
                Draft
              </label>

              {savedSlug && (
                <>
                  <a
                    href={`/posts/${savedSlug}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md px-2 py-1 text-meta text-muted transition-colors hover:text-accent"
                  >
                    View ↗
                  </a>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={busy}
                  >
                    Delete
                  </Button>
                </>
              )}

              <Button variant="primary" size="sm" onClick={save} disabled={busy || !dirty}>
                {busy ? "Saving…" : dirty ? "Save ⌘S" : "Saved"}
              </Button>
            </div>
          </div>

          {notice && (
            <div className="mt-2 border-t border-line pt-2">
              <Notice notice={notice} />
            </div>
          )}
        </div>

        {!focusMode && (
          <div className="mb-4 rounded-xl border border-line bg-raised shadow-sm">
            <div className="px-5 pb-4 pt-5">
              <input
                value={draft.title}
                onChange={(e) => {
                  const title = e.target.value;
                  update(slugTouched.current ? { title } : { title, slug: slugify(title) });
                }}
                placeholder="Untitled post"
                aria-label="Title"
                className="w-full bg-transparent text-title font-semibold outline-none placeholder:text-subtle"
              />
              <button
                onClick={() => setMetaOpen((o) => !o)}
                aria-expanded={metaOpen}
                className="mt-2 flex items-center gap-1.5 text-meta text-muted transition-colors hover:text-foreground"
              >
                <span aria-hidden className={`transition-transform ${metaOpen ? "rotate-90" : ""}`}>
                  ›
                </span>
                Details
                {!metaOpen && (
                  <span className="ml-1 truncate font-mono text-subtle">
                    /posts/{effectiveSlug}/ · {draft.date}
                    {draft.tags.length > 0 && ` · ${draft.tags.join(", ")}`}
                  </span>
                )}
              </button>
            </div>

            {metaOpen && (
              <div className="border-t border-line px-5 py-4">
                <MetaPanel
                  meta={draft}
                  effectiveSlug={effectiveSlug}
                  onChange={update}
                  onSlugEdited={() => {
                    slugTouched.current = true;
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-line bg-raised shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
            <EditorToolbar editor={editor} onPickImage={uploadFiles} disabled={view === EditorViewMode.Preview} />
            <span className="ml-auto hidden text-meta text-subtle sm:block">
              ⌘F find · ⌘Z undo · drag images in
            </span>
          </div>

          <div
            className={`grid ${view === EditorViewMode.Split ? "lg:grid-cols-2 lg:divide-x lg:divide-line" : "grid-cols-1"}`}
          >
            <div
              className={`${view === EditorViewMode.Preview ? "hidden" : "block"} ${
                focusMode ? EDITOR_PANE_HEIGHT_FOCUS : EDITOR_PANE_HEIGHT
              }`}
            >
              <MarkdownEditor
                ref={editor}
                value={draft.body}
                onChange={(body) => update({ body })}
                onSave={save}
                focusMode={focusMode}
                placeholder="Write in markdown. Drag images straight in."
              />
            </div>

            {view !== EditorViewMode.Write && (
              <div
                className={`overflow-y-auto px-5 py-6 ${
                  view === EditorViewMode.Split ? `hidden lg:block ${EDITOR_PANE_HEIGHT_LG}` : ""
                }`}
              >
                {draft.body.trim() ? (
                  <div
                    className="prose mx-auto max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <p className="py-16 text-center text-meta text-subtle">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-meta text-muted">
            <span className="font-mono">
              {savedSlug ? `content/posts/${savedSlug}.md` : "not saved yet"}
            </span>
            <span className="text-subtle">
              {dirty
                ? "Unsaved changes"
                : savedSlug
                  ? "All changes written to disk"
                  : "Not saved yet"}
            </span>
          </div>
        </div>
      </div>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-60 grid place-items-center bg-veil backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-accent bg-raised px-10 py-8 text-center shadow-md">
            <p className="text-lg font-semibold">Drop to upload</p>
            <p className="mt-1 text-meta text-muted">
              Images are saved to <span className="font-mono">public/images/</span> and linked at
              your cursor.
            </p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        tone="danger"
        title="Delete this post?"
        description="The markdown file is removed from disk. This cannot be undone from here — only with git."
        confirmLabel="Delete post"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      >
        <div className="rounded-lg border border-line bg-inset p-3">
          <p className="font-medium">{draft.title || "Untitled"}</p>
          <p className="mt-0.5 font-mono text-meta text-muted">
            content/posts/{savedSlug}.md
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
}
