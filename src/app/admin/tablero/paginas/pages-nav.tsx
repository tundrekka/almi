"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { createPageAction } from "../actions";

export type PageListItem = { id: string; icon: string; title: string };
export type PersonaItem = {
  id: string;
  email: string | null;
  color: string;
  count: number;
};

export function PagesNav({
  pages,
  personas,
}: {
  pages: PageListItem[];
  personas: PersonaItem[];
}) {
  const pathname = usePathname();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return pages;
    return pages.filter((p) => p.title.toLowerCase().includes(term));
  }, [pages, q]);

  return (
    <aside className="md:w-64 md:shrink-0 bg-white border-b border-line md:border-b-0 md:border-r md:sticky md:top-14 md:self-start md:h-[calc(100vh-3.5rem)] md:overflow-y-auto">
      <div className="flex flex-col gap-3 p-3">
        {/* Nueva página */}
        <form action={createPageAction}>
          <button
            type="submit"
            className="w-full h-9 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-electric cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <span className="text-base leading-none">+</span> Nueva página
          </button>
        </form>

        {/* Buscar */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar página…"
          className="h-9 rounded-lg border border-line px-3 text-sm focus:outline-none focus:border-ink"
        />

        {/* Páginas */}
        <div className="flex flex-col gap-0.5">
          <div className="px-2 pt-1 pb-0.5 text-[11px] uppercase tracking-wider text-muted">
            Páginas ({pages.length})
          </div>
          {filtered.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted">
              {q ? "Sin coincidencias." : "Aún no hay páginas."}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5 max-h-[42vh] overflow-y-auto">
              {filtered.map((p) => {
                const href = `/admin/tablero/paginas/${p.id}`;
                const active = pathname === href;
                return (
                  <li key={p.id}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-paper text-ink font-medium"
                          : "text-ink/80 hover:bg-paper"
                      }`}
                    >
                      <span className="shrink-0">{p.icon}</span>
                      <span className="truncate">{p.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Personas */}
        {personas.length > 0 ? (
          <div className="flex flex-col gap-0.5 border-t border-line pt-2">
            <div className="px-2 pb-0.5 text-[11px] uppercase tracking-wider text-muted">
              Por persona
            </div>
            <ul className="flex flex-col gap-0.5">
              {personas.map((a) => {
                const href = `/admin/tablero/paginas/persona/${a.id}`;
                const active = pathname === href;
                return (
                  <li key={a.id}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                        active ? "bg-paper text-ink font-medium" : "text-ink/80 hover:bg-paper"
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: a.color }}
                      />
                      <span className="truncate">{a.email ?? a.id.slice(0, 8)}</span>
                      <span className="ml-auto text-xs text-muted">{a.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
