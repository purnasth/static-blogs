"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import { EditorSelection, EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder as placeholderExt,
  rectangularSelection,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  redo,
  undo,
} from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  HighlightStyle,
  bracketMatching,
  syntaxHighlighting,
} from "@codemirror/language";
import { markdown, markdownKeymap, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { tags } from "@lezer/highlight";

/** Expressed as transactions, so commands respect multiple cursors and undo. */
export type MarkdownEditorHandle = {
  /** Wrap each selection; with an empty selection, drops the caret between the markers. */
  wrap: (before: string, after?: string) => void;
  /** Prefix every line touched by a selection, toggling it off if already present. */
  prefixLines: (prefix: string) => void;
  /** Insert text at the caret, replacing any selection. */
  insert: (text: string) => void;
  focus: () => void;
  undo: () => void;
  redo: () => void;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  placeholder?: string;
  /** Hides the gutter and widens the measure for distraction-free writing. */
  focusMode?: boolean;
  ref?: React.Ref<MarkdownEditorHandle>;
};

/** Reads CSS custom properties so the editor tracks the site theme automatically. */
const highlightStyle = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: "1.5em",
    fontWeight: "700",
    lineHeight: "1.3",
    color: "var(--fg)",
  },
  { tag: tags.heading2, fontSize: "1.3em", fontWeight: "650", color: "var(--fg)" },
  { tag: tags.heading3, fontSize: "1.15em", fontWeight: "650", color: "var(--fg)" },
  { tag: [tags.heading4, tags.heading5, tags.heading6], fontWeight: "650", color: "var(--fg)" },
  { tag: tags.strong, fontWeight: "700", color: "var(--fg)" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--fg-muted)" },
  { tag: tags.link, color: "var(--accent)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--accent)" },
  { tag: tags.quote, color: "var(--fg-muted)", fontStyle: "italic" },
  { tag: tags.monospace, color: "var(--accent)" },
  { tag: tags.list, color: "var(--accent)" },
  { tag: tags.contentSeparator, color: "var(--fg-subtle)" },
  // The literal markers (**, ##, >) stay visible but recede.
  { tag: tags.processingInstruction, color: "var(--fg-subtle)", fontWeight: "400" },
  // Fenced code blocks, highlighted per language via @codemirror/language-data.
  { tag: tags.comment, color: "var(--fg-subtle)", fontStyle: "italic" },
  { tag: tags.keyword, color: "var(--accent)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--ok)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--warn)" },
  { tag: [tags.typeName, tags.className], color: "var(--fg)" },
  { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: "var(--fg)" },
  { tag: tags.propertyName, color: "var(--fg-muted)" },
]);

const theme = EditorView.theme({
  "&": {
    fontSize: "0.9375rem",
    backgroundColor: "transparent",
    color: "var(--fg)",
    height: "100%",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono-stack), ui-monospace, monospace",
    lineHeight: "1.75",
    padding: "1.25rem 0",
  },
  ".cm-content": {
    padding: "0 1.25rem",
    caretColor: "var(--accent)",
    // Capped for readability but left-aligned — centring it strands the text
    // far from the line-number gutter in a wide panel.
    maxWidth: "78ch",
  },
  ".cm-line": { padding: "0 2px" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--accent-soft)",
  },
  ".cm-activeLine": { backgroundColor: "var(--bg-active)" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--fg-subtle)",
    border: "none",
    paddingRight: "0.35rem",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--fg-muted)" },
  ".cm-placeholder": { color: "var(--fg-subtle)" },
  ".cm-selectionMatch": { backgroundColor: "var(--warn-soft)" },
  ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": {
    backgroundColor: "var(--accent-soft)",
    outline: "1px solid var(--line-strong)",
  },
  // Search panel, so ⌘F doesn't look like a raw browser form.
  ".cm-panels": {
    backgroundColor: "var(--bg-raised)",
    color: "var(--fg)",
    borderTop: "1px solid var(--line)",
    fontFamily: "var(--font-sans-stack), sans-serif",
  },
  ".cm-panel.cm-search input, .cm-panel.cm-search button": {
    fontFamily: "inherit",
    fontSize: "0.8125rem",
  },
  ".cm-panel.cm-search input": {
    backgroundColor: "var(--bg)",
    color: "var(--fg)",
    border: "1px solid var(--line)",
    borderRadius: "0.25rem",
    padding: "0.15rem 0.4rem",
  },
  ".cm-button": {
    backgroundColor: "var(--bg-inset)",
    backgroundImage: "none",
    color: "var(--fg)",
    border: "1px solid var(--line)",
    borderRadius: "0.25rem",
  },
  ".cm-textfield": { backgroundColor: "var(--bg)", borderColor: "var(--line)" },
});

export default function MarkdownEditor({
  value,
  onChange,
  onSave,
  placeholder = "Write in markdown…",
  focusMode = false,
  ref,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  // Kept in refs so the editor is created once and never torn down mid-typing.
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    if (!host.current) return;

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      drawSelection(),
      rectangularSelection(),
      bracketMatching(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      placeholderExt(placeholder),
      markdown({ base: markdownLanguage, codeLanguages: languages, addKeymap: false }),
      syntaxHighlighting(highlightStyle),
      theme,
      keymap.of([
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            onSaveRef.current();
            return true;
          },
        },
        // Before defaultKeymap so Enter continues lists/quotes and Backspace
        // unwraps markup rather than falling through to plain newline/delete.
        ...markdownKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...defaultKeymap,
        indentWithTab,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current(update.state.doc.toString());
      }),
    ];

    const instance = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: host.current,
    });
    view.current = instance;

    return () => {
      instance.destroy();
      view.current = null;
    };
    // Built once: `value` is synced by the effect below, and the callbacks live
    // in refs. Rebuilding on every keystroke would destroy undo history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder]);

  // Sync external changes (loading a post, an image URL inserted elsewhere)
  // without clobbering the cursor when the doc already matches.
  useEffect(() => {
    const instance = view.current;
    if (!instance) return;
    const current = instance.state.doc.toString();
    if (current === value) return;
    instance.dispatch({
      changes: { from: 0, to: current.length, insert: value },
      selection: { anchor: Math.min(instance.state.selection.main.anchor, value.length) },
    });
  }, [value]);

  useImperativeHandle(
    ref,
    (): MarkdownEditorHandle => ({
      focus: () => view.current?.focus(),
      undo: () => {
        const v = view.current;
        if (!v) return;
        undo(v);
        v.focus();
      },
      redo: () => {
        const v = view.current;
        if (!v) return;
        redo(v);
        v.focus();
      },

      insert(text) {
        const v = view.current;
        if (!v) return;
        v.dispatch(
          v.state.changeByRange((range) => ({
            changes: { from: range.from, to: range.to, insert: text },
            range: EditorSelection.cursor(range.from + text.length),
          })),
          { userEvent: "input" },
        );
        v.focus();
      },

      wrap(before, after = before) {
        const v = view.current;
        if (!v) return;
        v.dispatch(
          v.state.changeByRange((range) => {
            const selected = v.state.sliceDoc(range.from, range.to);
            const insert = `${before}${selected}${after}`;
            return {
              changes: { from: range.from, to: range.to, insert },
              // Empty selection → caret between the markers. Otherwise keep the
              // text selected so it can be styled twice in a row.
              range: range.empty
                ? EditorSelection.cursor(range.from + before.length)
                : EditorSelection.range(
                    range.from + before.length,
                    range.from + before.length + selected.length,
                  ),
            };
          }),
          { userEvent: "input" },
        );
        v.focus();
      },

      prefixLines(prefix) {
        const v = view.current;
        if (!v) return;
        const { state } = v;
        const lines = new Set<number>();
        for (const range of state.selection.ranges) {
          const start = state.doc.lineAt(range.from).number;
          const end = state.doc.lineAt(range.to).number;
          for (let n = start; n <= end; n++) lines.add(n);
        }

        const targets = [...lines].map((n) => state.doc.line(n));
        // Toggle: if every touched line already has the prefix, strip it.
        const allPrefixed = targets.every((line) => line.text.startsWith(prefix));

        v.dispatch(
          {
            changes: targets.map((line) =>
              allPrefixed
                ? { from: line.from, to: line.from + prefix.length, insert: "" }
                : { from: line.from, insert: prefix },
            ),
          },
          { userEvent: "input" },
        );
        v.focus();
      },
    }),
    [],
  );

  return (
    <div
      ref={host}
      data-focus-mode={focusMode || undefined}
      className="h-full overflow-hidden [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto data-[focus-mode]:[&_.cm-gutters]:hidden"
    />
  );
}
