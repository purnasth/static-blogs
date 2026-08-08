"use client";

import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import type { Tone } from "@/components/ui/tone";

type Props = {
  open: boolean;
  title: string;
  /** What is about to happen, and what it cannot undo. */
  description: React.ReactNode;
  /** Optional detail block: the file list, the commit message, the target. */
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: Extract<Tone, "accent" | "danger">;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Native <dialog> gives focus trapping, Esc and page inertness for free. */
export default function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "accent",
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Esc fires `cancel`; the parent owns `open`, so route it back up.
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      // Clicking the backdrop lands on the dialog element itself.
      onClick={(event) => {
        if (event.target === ref.current && !busy) onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-raised p-0 text-foreground shadow-md backdrop:bg-overlay"
    >
      <div className="p-5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <div className="mt-1.5 text-meta text-muted">{description}</div>
        {children && <div className="mt-4">{children}</div>}
      </div>

      <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
        <Button size="sm" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          size="sm"
          variant={tone === "danger" ? "destructive" : "primary"}
          onClick={onConfirm}
          disabled={busy}
          autoFocus
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
