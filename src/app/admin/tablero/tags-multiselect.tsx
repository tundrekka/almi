"use client";

import { useEffect, useRef, useState } from "react";

type IconProps = { className?: string };

function IconTag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20.59 13.41 13 21a2 2 0 0 1-2.83 0L3 13.83V4h9.83L21 12.17a2 2 0 0 1-.41 1.24Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
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
function IconChevron({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IconHelp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function TagsMultiSelect({
  allTags,
  selected,
  onToggle,
  onClear,
  untagged = false,
  onToggleUntagged,
}: {
  allTags: { tag: string; count: number }[];
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
  untagged?: boolean;
  onToggleUntagged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedSet = new Set(selected);
  const filtered = query
    ? allTags.filter((t) => t.tag.toLowerCase().includes(query.toLowerCase()))
    : allTags;

  const label = untagged
    ? "Sin tags"
    : selected.length === 0
      ? "Todos los tags"
      : selected.length === 1
        ? `#${selected[0]}`
        : `${selected.length} tags`;

  const isActive = untagged || selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-10 inline-flex items-center gap-2 rounded-xl border bg-white pl-9 pr-3 text-sm focus:outline-none ${
          isActive
            ? "border-ink text-ink"
            : "border-line text-ink hover:border-ink"
        }`}
      >
        <IconTag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <span className="max-w-[160px] truncate">{label}</span>
        <IconChevron className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-72 rounded-xl border border-line bg-white shadow-lg p-2 right-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] uppercase tracking-wider text-muted">
              Filtrar por tags
            </span>
            <span className="relative group">
              <IconHelp className="h-3.5 w-3.5 text-muted hover:text-ink cursor-help" />
              <span className="invisible group-hover:visible absolute right-0 top-full mt-1 z-30 w-64 rounded-lg bg-ink text-paper text-[11px] leading-snug p-2 shadow-lg">
                Las tags se combinan con <strong>AND</strong>: se muestran solo
                las notas cuyo conjunto de tags incluya <em>todas</em> las
                seleccionadas simultáneamente. No es un filtro OR.
              </span>
            </span>
          </div>
          <div className="relative mb-2">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tag…"
              className="w-full h-8 rounded-lg border border-line bg-white pl-8 pr-2 text-xs focus:outline-none focus:border-ink"
            />
          </div>

          <div className="max-h-64 overflow-y-auto flex flex-col">
            {onToggleUntagged ? (
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-paper cursor-pointer border-b border-line mb-1">
                <input
                  type="checkbox"
                  checked={untagged}
                  onChange={onToggleUntagged}
                  className="h-3.5 w-3.5 accent-ink"
                />
                <span className="flex-1 text-sm italic text-muted">Sin tags</span>
              </label>
            ) : null}
            {filtered.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted text-center">Sin resultados</div>
            ) : (
              filtered.map(({ tag: t, count }) => {
                const checked = selectedSet.has(t);
                return (
                  <label
                    key={t}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer ${
                      untagged ? "opacity-40 cursor-not-allowed" : "hover:bg-paper"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={untagged}
                      onChange={() => onToggle(t)}
                      className="h-3.5 w-3.5 accent-ink"
                    />
                    <span className="flex-1 text-sm truncate">#{t}</span>
                    <span className="text-[11px] text-muted">{count}</span>
                  </label>
                );
              })
            )}
          </div>

          {isActive ? (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-line">
              <span className="text-[11px] text-muted">
                {untagged
                  ? "Sin tags"
                  : `${selected.length} seleccionado${selected.length === 1 ? "" : "s"}`}
              </span>
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] text-muted hover:text-ink underline"
              >
                Limpiar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
