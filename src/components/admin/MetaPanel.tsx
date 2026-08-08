"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui";
import { SUMMARY_MAX_LENGTH } from "@/lib/constants";
import { slugify } from "@/lib/slug";

export type Meta = {
  slug: string;
  date: string;
  summary: string;
  tags: string[];
  cover: string;
};

type Props = {
  meta: Meta;
  /** The slug actually used if the field is left blank (derived from the title). */
  effectiveSlug: string;
  onChange: (patch: Partial<Meta>) => void;
  onSlugEdited: () => void;
};

export default function MetaPanel({ meta, effectiveSlug, onChange, onSlugEdited }: Props) {
  const [tagDraft, setTagDraft] = useState("");

  function commitTag(raw: string) {
    const value = raw.trim().replace(/,+$/, "").toLowerCase();
    if (value && !meta.tags.includes(value)) onChange({ tags: [...meta.tags, value] });
    setTagDraft("");
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="URL" hint={<span className="font-mono">/posts/{effectiveSlug}/</span>}>
        <Input
          value={meta.slug}
          onChange={(e) => {
            onSlugEdited();
            onChange({ slug: e.target.value });
          }}
          // Normalise on blur rather than per keystroke, so a trailing hyphen
          // can still be typed on the way to the next word.
          onBlur={(e) => onChange({ slug: slugify(e.target.value) })}
          placeholder={effectiveSlug}
          className="font-mono"
        />
      </Field>

      <Field label="Date">
        <Input
          type="date"
          value={meta.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </Field>

      <Field
        label="Summary"
        hint={
          <span className={meta.summary.length > SUMMARY_MAX_LENGTH ? "text-warn" : undefined}>
            {meta.summary.length}/{SUMMARY_MAX_LENGTH}
          </span>
        }
      >
        <Input
          value={meta.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="One line shown on the home page and in search results"
        />
      </Field>

      <Field label="Cover image" hint={meta.cover ? undefined : "optional"}>
        <div className="flex items-center gap-2">
          {meta.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.cover}
              alt=""
              className="size-9 shrink-0 rounded-md border border-line object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          )}
          <Input
            value={meta.cover}
            onChange={(e) => onChange({ cover: e.target.value })}
            placeholder="/images/cover.jpg"
            className="font-mono"
          />
        </div>
      </Field>

      <div className="sm:col-span-2">
        <Field label="Tags" hint="Enter or comma to add · Backspace to remove">
          <div
            onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
            className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-background px-2 py-1.5 transition-colors focus-within:border-accent hover:border-line-strong"
          >
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-2.5 pr-1 text-meta text-accent"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => onChange({ tags: meta.tags.filter((t) => t !== tag) })}
                  className="grid size-4 place-items-center rounded-full text-micro transition-colors hover:bg-accent hover:text-accent-contrast"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => {
                // A comma commits, matching how people paste lists.
                if (e.target.value.includes(",")) commitTag(e.target.value);
                else setTagDraft(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitTag(tagDraft);
                } else if (e.key === "Backspace" && !tagDraft && meta.tags.length > 0) {
                  onChange({ tags: meta.tags.slice(0, -1) });
                }
              }}
              onBlur={() => commitTag(tagDraft)}
              placeholder={meta.tags.length === 0 ? "photography, nepal" : ""}
              aria-label="Add a tag"
              className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
            />
          </div>
        </Field>
      </div>
    </div>
  );
}
