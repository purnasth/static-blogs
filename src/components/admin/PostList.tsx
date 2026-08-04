"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import type { PublishStatus } from "@/lib/storage";
import type { Post } from "@/lib/types";

type Props = {
  posts: Post[];
  status: PublishStatus;
};

export default function PostList({ posts, status }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function publish() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/publish/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setNotice({ kind: data.ok ? "ok" : "error", text: data.detail ?? data.error });
      setMessage("");
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Publish failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <Link
            href="/admin/edit/new/"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            New post
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted">Nothing written yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {posts.map((post) => (
              <li key={post.slug} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/edit/${post.slug}/`}
                    className="block truncate font-medium hover:text-accent"
                  >
                    {post.title}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    <span>{formatDate(post.date)}</span>
                    {post.tags.length > 0 && <span>· {post.tags.join(", ")}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  {post.draft ? (
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">draft</span>
                  ) : (
                    <span className="text-muted">published</span>
                  )}
                  <a href={`/posts/${post.slug}/`} target="_blank" className="text-muted hover:text-accent">
                    preview ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-line p-4">
        <h2 className="font-semibold">Publish</h2>
        <p className="mt-1 text-sm text-muted">
          Branch <span className="font-mono">{status.branch}</span> ·{" "}
          {status.remote ? "remote connected" : "no remote configured"} ·{" "}
          {status.dirty.length === 0
            ? "nothing to publish"
            : `${status.dirty.length} unpublished change(s)`}
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What changed? (optional)"
            className="flex-1 rounded-md border border-line bg-transparent px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={publish}
            disabled={busy || status.dirty.length === 0}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {busy ? "Publishing…" : "Commit & push"}
          </button>
        </div>

        {notice && (
          <p className={`mt-3 text-sm ${notice.kind === "ok" ? "text-muted" : "text-accent"}`}>
            {notice.text}
          </p>
        )}
      </section>
    </div>
  );
}
