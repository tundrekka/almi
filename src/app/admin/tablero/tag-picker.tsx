"use client";

import { useEffect, useRef, useState } from "react";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function TagPicker({
  selected,
  existing,
  onChange,
}: {
  selected: string[];
  existing: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("mousedown", onClickAway);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClickAway);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function add(tag: string) {
    const t = normalize(tag);
    if (!t) return;
    if (selected.includes(t)) return;
    onChange([...selected, t]);
    setQuery("");
  }

  function remove(tag: string) {
    onChange(selected.filter((t) => t !== tag));
  }

  const q = query.trim().toLowerCase();
  const candidates = existing.filter(
    (t) => !selected.includes(t) && (!q || t.includes(q)),
  );
  const normalizedQuery = normalize(query);
  const canCreate =
    normalizedQuery.length > 0 &&
    !selected.includes(normalizedQuery) &&
    !existing.includes(normalizedQuery);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 min-h-[40px] rounded-xl border border-line bg-white px-2 py-1.5">
        {selected.length === 0 ? (
          <span className="text-xs text-muted px-1">Sin tags</span>
        ) : (
          selected.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-ink text-paper text-xs pl-2.5 pr-1 py-1"
            >
              #{t}
              <button
                type="button"
                onClick={() => remove(t)}
                aria-label={`Quitar ${t}`}
                className="h-4 w-4 rounded-full hover:bg-white/20 flex items-center justify-center text-sm leading-none"
              >
                ×
              </button>
            </span>
          ))
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-line text-xs px-2.5 py-1 text-muted hover:text-ink hover:border-ink"
        >
          + Tag
        </button>
      </div>

      {open ? (
        <div className="absolute z-30 mt-1 w-72 max-h-72 overflow-auto rounded-xl border border-line bg-white shadow-lg">
          <div className="p-2 border-b border-line bg-paper/40">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canCreate) add(query);
                  else if (candidates[0]) add(candidates[0]);
                }
              }}
              placeholder="Buscar o crear tag…"
              className="w-full h-9 rounded-lg border border-line bg-white px-2.5 text-sm focus:outline-none focus:border-ink"
            />
          </div>
          <ul className="py-1">
            {canCreate ? (
              <li>
                <button
                  type="button"
                  onClick={() => add(query)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-paper flex items-center gap-2"
                >
                  <span className="text-electric">+</span>
                  Crear <span className="font-medium">#{normalizedQuery}</span>
                </button>
              </li>
            ) : null}
            {candidates.length === 0 && !canCreate ? (
              <li className="px-3 py-2 text-xs text-muted">
                {existing.length === 0
                  ? "Aún no hay tags. Escribe uno para crearlo."
                  : "Sin coincidencias."}
              </li>
            ) : null}
            {candidates.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => add(t)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-paper"
                >
                  #{t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
