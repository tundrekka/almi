"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "../spinner";
import { TagsMultiSelect } from "../tags-multiselect";

type IconProps = { className?: string };

function IconAll({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconText({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" />
    </svg>
  );
}
function IconLink({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71" />
    </svg>
  );
}
function IconImage({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
function IconAudio({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function IconFile({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconUser({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconTag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20.59 13.41 13 21a2 2 0 0 1-2.83 0L3 13.83V4h9.83L21 12.17a2 2 0 0 1-.41 1.24Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}
function IconX({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

const KINDS: { value: string; label: string; Icon: (p: IconProps) => React.ReactElement }[] = [
  { value: "", label: "Todos", Icon: IconAll },
  { value: "text", label: "Texto", Icon: IconText },
  { value: "link", label: "Links", Icon: IconLink },
  { value: "image", label: "Imágenes", Icon: IconImage },
  { value: "audio", label: "Audio", Icon: IconAudio },
  { value: "file", label: "Documentos", Icon: IconFile },
  { value: "todo", label: "To dos", Icon: IconCheck },
];

const KIND_LABEL = Object.fromEntries(KINDS.map((k) => [k.value, k.label]));

export function FeedFilters({
  q,
  kind,
  tags,
  author,
  untagged,
  allTags,
  allAuthors,
  basePath = "/admin/tablero/feed",
}: {
  q: string;
  kind: string;
  tags: string[];
  author: string;
  untagged: boolean;
  allTags: { tag: string; count: number }[];
  allAuthors: { id: string; email: string | null; color: string; count: number }[];
  basePath?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(sp?.toString() ?? "");
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    startTransition(() => {
      router.replace(`${basePath}${next.size ? `?${next.toString()}` : ""}`);
    });
  }

  function toggleTag(t: string) {
    const set = new Set(tags);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    update({ tag: [...set].join(","), untagged: "" });
  }

  function toggleUntagged() {
    update({ untagged: untagged ? "" : "1", tag: "" });
  }

  const authorById = new Map(allAuthors.map((a) => [a.id, a]));
  const authorLabel = (id: string) => {
    const a = authorById.get(id);
    return a?.email ?? id.slice(0, 6);
  };

  const active: { key: string; value: string; label: string; onClear: () => void }[] = [];
  if (q)
    active.push({ key: "q", value: "", label: `"${q}"`, onClear: () => update({ q: "" }) });
  if (kind)
    active.push({
      key: "kind",
      value: "",
      label: KIND_LABEL[kind] ?? kind,
      onClear: () => update({ kind: "" }),
    });
  for (const t of tags)
    active.push({
      key: `tag:${t}`,
      value: t,
      label: `#${t}`,
      onClear: () => toggleTag(t),
    });
  if (untagged)
    active.push({
      key: "untagged",
      value: "",
      label: "Sin tags",
      onClear: () => update({ untagged: "" }),
    });
  if (author)
    active.push({
      key: "author",
      value: "",
      label: `@${authorLabel(author)}`,
      onClear: () => update({ author: "" }),
    });

  const hasAny = active.length > 0;

  return (
    <div className="rounded-2xl border border-line bg-white p-3 flex flex-col gap-3">
      {/* Búsqueda + selects en una sola fila */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            defaultValue={q}
            onChange={(e) => {
              const v = e.target.value;
              window.clearTimeout((window as unknown as { __qT?: number }).__qT);
              (window as unknown as { __qT?: number }).__qT = window.setTimeout(
                () => update({ q: v }),
                250,
              );
            }}
            placeholder="Buscar texto, links, nombres…"
            className="w-full h-10 rounded-xl border border-line bg-white pl-9 pr-9 text-sm focus:outline-none focus:border-ink"
          />
          {isPending ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center text-muted">
              <Spinner className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>

        {allAuthors.length > 0 ? (
          <div className="relative">
            <IconUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <select
              value={author}
              onChange={(e) => update({ author: e.target.value })}
              className="h-10 rounded-xl border border-line bg-white pl-9 pr-8 text-sm focus:outline-none focus:border-ink appearance-none"
            >
              <option value="">Todos los autores</option>
              {allAuthors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email ?? a.id.slice(0, 6)} ({a.count})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {allTags.length > 0 ? (
          <TagsMultiSelect
            allTags={allTags}
            selected={tags}
            onToggle={toggleTag}
            onClear={() => update({ tag: "", untagged: "" })}
            untagged={untagged}
            onToggleUntagged={toggleUntagged}
          />
        ) : null}

        {hasAny ? (
          <button
            type="button"
            onClick={() => update({ q: "", kind: "", tag: "", author: "", untagged: "" })}
            className="h-10 px-3 rounded-xl border border-line text-xs text-muted hover:text-ink hover:border-ink"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      {/* Tipo de bloque — compacto */}
      <div className="flex flex-wrap gap-1.5">
        {KINDS.map(({ value, label, Icon }) => {
          const isActive = kind === value;
          return (
            <button
              key={value || "all"}
              type="button"
              onClick={() => update({ kind: value })}
              className={`h-8 inline-flex items-center gap-1.5 px-2.5 rounded-full text-xs transition-colors ${
                isActive
                  ? "bg-ink text-paper border border-ink"
                  : "bg-white border border-line text-muted hover:text-ink hover:border-ink"
              }`}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Filtros aplicados */}
      {hasAny ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line">
          {active.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 rounded-full bg-ink text-paper text-[11px] pl-2.5 pr-1 py-0.5"
            >
              {f.label}
              <button
                type="button"
                onClick={f.onClear}
                aria-label={`Quitar filtro ${f.label}`}
                className="h-4 w-4 rounded-full hover:bg-white/20 flex items-center justify-center"
              >
                <IconX className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

