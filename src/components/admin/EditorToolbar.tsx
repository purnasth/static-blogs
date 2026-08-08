"use client";

import type { MarkdownEditorHandle } from "@/components/admin/MarkdownEditor";
import {
  BulletListIcon,
  CodeBlockIcon,
  CodeIcon,
  DividerIcon,
  ImageIcon,
  LinkIcon,
  NumberListIcon,
  QuoteIcon,
  TaskIcon,
} from "@/components/admin/icons";

type Props = {
  editor: React.RefObject<MarkdownEditorHandle | null>;
  onPickImage: (files: FileList) => void;
  disabled?: boolean;
};

/** Commands go through the CodeMirror handle, so each is a single undo step. */
export default function EditorToolbar({ editor, onPickImage, disabled }: Props) {
  const run = (fn: (e: MarkdownEditorHandle) => void) => () => {
    const instance = editor.current;
    if (instance) fn(instance);
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <Tool label="Bold" hint="⌘B" onClick={run((e) => e.wrap("**"))} disabled={disabled}>
        <span className="text-ui font-bold">B</span>
      </Tool>
      <Tool label="Italic" hint="⌘I" onClick={run((e) => e.wrap("_"))} disabled={disabled}>
        <span className="text-ui font-serif italic">I</span>
      </Tool>
      <Tool label="Strikethrough" onClick={run((e) => e.wrap("~~"))} disabled={disabled}>
        <span className="text-ui line-through">S</span>
      </Tool>

      <Divider />

      <Tool label="Heading 2" onClick={run((e) => e.prefixLines("## "))} disabled={disabled}>
        <span className="text-meta font-semibold">H2</span>
      </Tool>
      <Tool label="Heading 3" onClick={run((e) => e.prefixLines("### "))} disabled={disabled}>
        <span className="text-meta font-semibold">H3</span>
      </Tool>

      <Divider />

      <Tool label="Bulleted list" onClick={run((e) => e.prefixLines("- "))} disabled={disabled}>
        <BulletListIcon />
      </Tool>
      <Tool label="Numbered list" onClick={run((e) => e.prefixLines("1. "))} disabled={disabled}>
        <NumberListIcon />
      </Tool>
      <Tool label="Task list" onClick={run((e) => e.prefixLines("- [ ] "))} disabled={disabled}>
        <TaskIcon />
      </Tool>
      <Tool label="Blockquote" onClick={run((e) => e.prefixLines("> "))} disabled={disabled}>
        <QuoteIcon />
      </Tool>

      <Divider />

      <Tool
        label="Link"
        hint="⌘K"
        onClick={run((e) => e.wrap("[", "](https://)"))}
        disabled={disabled}
      >
        <LinkIcon />
      </Tool>
      <Tool label="Inline code" onClick={run((e) => e.wrap("`"))} disabled={disabled}>
        <CodeIcon />
      </Tool>
      <Tool
        label="Code block"
        onClick={run((e) => e.insert("\n```\n\n```\n"))}
        disabled={disabled}
      >
        <CodeBlockIcon />
      </Tool>
      <Tool label="Divider" onClick={run((e) => e.insert("\n\n---\n\n"))} disabled={disabled}>
        <DividerIcon />
      </Tool>

      <Divider />

      <label
        title="Insert image — or drag one onto the editor"
        className={`grid size-7 cursor-pointer place-items-center rounded-md text-muted transition-colors hover:bg-inset hover:text-foreground ${
          disabled ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ImageIcon />
        <span className="sr-only">Insert image</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) onPickImage(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1.5 h-4 w-px bg-line" />;
}

function Tool({
  label,
  hint,
  onClick,
  disabled,
  children,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint ? `${label} (${hint})` : label}
      className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-inset hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
