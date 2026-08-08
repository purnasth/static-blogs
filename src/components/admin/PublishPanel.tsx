"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  Notice,
  Panel,
  PanelHeader,
  type NoticeState,
} from "@/components/ui";
import {
  COMMIT_MESSAGE_EXAMPLES,
  COMMIT_MESSAGE_MIN_LENGTH,
  COMMIT_MESSAGE_PLACEHOLDER,
} from "@/lib/constants";
import type { PublishStatus } from "@/lib/storage";

function describe(paths: string[]) {
  const posts = paths.filter((p) => p.startsWith("content/posts/"));
  const images = paths.filter((p) => p.startsWith("public/images/"));
  return { posts, images, other: paths.length - posts.length - images.length };
}

export default function PublishPanel({ status }: { status: PublishStatus }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [open, setOpen] = useState(false);

  const { posts, images, other } = describe(status.dirty);
  const count = status.dirty.length;
  const trimmed = message.trim();

  // Say *why* the button is off rather than just greying it out.
  const blocked = useMemo(() => {
    if (count === 0) return "Nothing has changed since the last commit.";
    if (trimmed.length === 0) return "Describe what changed before publishing.";
    if (trimmed.length < COMMIT_MESSAGE_MIN_LENGTH) return `A little more detail — at least ${COMMIT_MESSAGE_MIN_LENGTH} characters.`;
    return null;
  }, [count, trimmed]);

  async function publish() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/publish/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      setNotice({ kind: data.ok ? "ok" : "error", text: data.detail ?? data.error });
      if (data.ok) setMessage("");
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Publish failed." });
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <Panel>
      <PanelHeader
        title="Publish"
        description="Commits your posts and images, then pushes so the host rebuilds."
      >
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-meta">
          <Fact label="Branch">
            <span className="font-mono text-foreground">{status.branch}</span>
          </Fact>
          <Fact label="Remote">
            <span className={status.remote ? "text-ok" : "text-warn"}>
              {status.remote ? "connected" : "not configured"}
            </span>
          </Fact>
          <Fact label="Pending">
            <span className={count > 0 ? "text-foreground" : "text-muted"}>
              {count} {count === 1 ? "change" : "changes"}
            </span>
          </Fact>
        </dl>
      </PanelHeader>

      {count > 0 && (
        <div className="border-b border-line px-5 py-3">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-center gap-2 text-meta text-muted transition-colors hover:text-foreground"
          >
            <Chevron open={open} />
            {open ? "Hide" : "Show"} what will be published
            <span className="ml-auto text-subtle">{summarise(posts.length, images.length, other)}</span>
          </button>

          {open && <FileList paths={status.dirty} />}
        </div>
      )}

      <div className="px-5 py-4">
        <Field
          label="What changed?"
          hint={<span className="tabular-nums">{trimmed.length}</span>}
          help={
            <>
              Written straight into the git commit. Convention: a scope, then what you did — e.g.{" "}
              {COMMIT_MESSAGE_EXAMPLES.map((example, i) => (
                <span key={example}>
                  {i > 0 && " · "}
                  <button
                    type="button"
                    onClick={() => setMessage(example)}
                    className="font-mono text-subtle underline decoration-dotted underline-offset-2 transition-colors hover:text-accent"
                  >
                    {example}
                  </button>
                </span>
              ))}
            </>
          }
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !blocked && !busy) setConfirming(true);
              }}
              placeholder={COMMIT_MESSAGE_PLACEHOLDER}
              aria-invalid={trimmed.length > 0 && trimmed.length < COMMIT_MESSAGE_MIN_LENGTH}
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={() => setConfirming(true)}
              disabled={busy || blocked !== null}
              title={blocked ?? undefined}
            >
              {busy ? "Publishing…" : "Commit & push"}
            </Button>
          </div>
        </Field>

        <div className="mt-3 space-y-1.5">
          {blocked && !notice && <p className="text-meta text-subtle">{blocked}</p>}
          {!status.remote && (
            <p className="text-meta text-warn">
              No git remote — changes will commit locally but nothing will deploy.
            </p>
          )}
          <Notice notice={notice} />
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Publish to the live site?"
        description={
          status.remote ? (
            <>
              This commits {count} {count === 1 ? "change" : "changes"} and pushes to{" "}
              <span className="font-mono text-foreground">{status.branch}</span>. The host will
              rebuild and the post becomes public.
            </>
          ) : (
            <>
              This commits {count} {count === 1 ? "change" : "changes"} locally. There is no remote
              configured, so nothing will be pushed or deployed.
            </>
          )
        }
        confirmLabel={status.remote ? "Commit & push" : "Commit locally"}
        busy={busy}
        onConfirm={publish}
        onCancel={() => setConfirming(false)}
      >
        <div className="rounded-lg border border-line bg-inset p-3">
          <p className="eyebrow mb-1.5">Commit message</p>
          <p className="font-mono text-meta text-foreground">{trimmed}</p>
        </div>
      </ConfirmDialog>
    </Panel>
  );
}

function summarise(posts: number, images: number, other: number) {
  return [
    posts > 0 && `${posts} post${posts === 1 ? "" : "s"}`,
    images > 0 && `${images} image${images === 1 ? "" : "s"}`,
    other > 0 && `${other} other`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-subtle">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span aria-hidden className={`transition-transform ${open ? "rotate-90" : ""}`}>
      ›
    </span>
  );
}

function FileList({ paths }: { paths: string[] }) {
  return (
    <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-lg bg-inset p-3 font-mono text-meta text-muted">
      {paths.map((path) => (
        <li key={path} className="truncate" title={path}>
          {path}
        </li>
      ))}
    </ul>
  );
}
