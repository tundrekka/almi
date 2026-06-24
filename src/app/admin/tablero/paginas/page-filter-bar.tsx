"use client";

import { useState } from "react";
import { FeedFilters } from "../feed/filters";

export function PageFilterBar({
  basePath,
  q,
  kind,
  tags,
  author,
  untagged,
  allTags,
  allAuthors,
}: {
  basePath: string;
  q: string;
  kind: string;
  tags: string[];
  author: string;
  untagged: boolean;
  allTags: { tag: string; count: number }[];
  allAuthors: { id: string; email: string | null; color: string; count: number }[];
}) {
  const hasActive = !!(q || kind || author || untagged || tags.length);
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`self-start inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-sm transition-colors ${
          open || hasActive
            ? "border-ink text-ink"
            : "border-line text-muted hover:text-ink hover:border-ink"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
          <path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" />
        </svg>
        Filtrar bloques
        {hasActive ? <span className="h-1.5 w-1.5 rounded-full bg-electric" /> : null}
      </button>

      {open ? (
        <FeedFilters
          basePath={basePath}
          q={q}
          kind={kind}
          tags={tags}
          author={author}
          untagged={untagged}
          allTags={allTags}
          allAuthors={allAuthors}
        />
      ) : null}
    </div>
  );
}
