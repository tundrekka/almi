"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toggleTodoAction } from "../actions";
import { Spinner } from "../spinner";
import { TagsMultiSelect } from "../tags-multiselect";

type Row = {
  noteId: string;
  noteTitle: string | null;
  noteDate: string;
  blockId: string;
  authorId: string;
  item: { id: string; text: string; done: boolean };
};

type AuthorMap = Record<string, { email: string | null; color: string }>;

function fmtDate(s: string): string {
  const d = new Date(s);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const date = d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    ...(sameYear ? {} : { year: "2-digit" }),
  });
  const time = d.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} · ${time}`;
}

export function TodosBoard({
  rows,
  authors,
  q,
  author,
  tags,
  untagged,
  authorOptions,
  tagOptions,
}: {
  rows: Row[];
  authors: AuthorMap;
  q: string;
  author: string;
  tags: string[];
  untagged: boolean;
  authorOptions: { id: string; email: string | null; color: string }[];
  tagOptions: { tag: string; count: number }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState<Row[]>(rows);

  useEffect(() => {
    setLocal(rows);
  }, [rows]);

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(sp?.toString() ?? "");
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    startTransition(() => {
      router.replace(
        `/admin/tablero/todos${next.size ? `?${next.toString()}` : ""}`,
      );
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

  function toggle(r: Row) {
    const next = !r.item.done;
    setLocal((prev) =>
      prev.map((x) =>
        x.item.id === r.item.id ? { ...x, item: { ...x.item, done: next } } : x,
      ),
    );
    void toggleTodoAction(r.noteId, r.blockId, r.item.id, next);
  }

  const pending = local.filter((r) => !r.item.done);
  const done = local.filter((r) => r.item.done);
  const hasAny = q || author || tags.length > 0 || untagged;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-line bg-white p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <input
            defaultValue={q}
            onChange={(e) => {
              const v = e.target.value;
              window.clearTimeout((window as unknown as { __qTodos?: number }).__qTodos);
              (window as unknown as { __qTodos?: number }).__qTodos = window.setTimeout(
                () => update({ q: v }),
                250,
              );
            }}
            placeholder="Buscar to dos…"
            className="w-full h-10 rounded-xl border border-line bg-white px-3 pr-9 text-sm focus:outline-none focus:border-ink"
          />
          {isPending ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center text-muted">
              <Spinner className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>

        <select
          value={author}
          onChange={(e) => update({ author: e.target.value })}
          className="h-10 rounded-xl border border-line bg-white px-3 text-sm focus:outline-none focus:border-ink appearance-none"
        >
          <option value="">Todos los autores</option>
          {authorOptions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.email ?? a.id.slice(0, 6)}
            </option>
          ))}
        </select>

        {tagOptions.length > 0 ? (
          <TagsMultiSelect
            allTags={tagOptions}
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
            onClick={() => update({ q: "", author: "", tag: "", untagged: "" })}
            className="h-10 px-3 rounded-xl border border-line text-xs text-muted hover:text-ink hover:border-ink"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Column
          title="Pendientes"
          rows={pending}
          authors={authors}
          onToggle={toggle}
          q={q}
        />
        <Column
          title="Hechos"
          rows={done}
          authors={authors}
          onToggle={toggle}
          q={q}
          muted
        />
      </div>
    </div>
  );
}

function Column({
  title,
  rows,
  authors,
  onToggle,
  q,
  muted,
}: {
  title: string;
  rows: Row[];
  authors: AuthorMap;
  onToggle: (r: Row) => void;
  q: string;
  muted?: boolean;
}) {
  const count = rows.length;
  return (
    <section className="rounded-2xl border border-line bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-line">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            muted ? "bg-paper text-muted" : "bg-ink text-paper"
          }`}
        >
          {count}
        </span>
      </header>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
          <div className="h-8 w-8 rounded-full bg-paper flex items-center justify-center text-muted">
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
          </div>
          <p className="text-xs text-muted">
            {muted ? "Sin items completados" : "Todo al día"}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((r) => {
            const a = authors[r.authorId];
            const color = a?.color ?? "#9CA3AF";
            const email = a?.email ?? "—";
            const shortEmail = email.includes("@")
              ? email.split("@")[0]
              : email;
            return (
              <li
                key={`${r.noteId}-${r.item.id}`}
                className="group flex items-start gap-3 px-4 py-3 hover:bg-paper/40 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onToggle(r)}
                  className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                    r.item.done
                      ? "bg-electric border-electric text-paper"
                      : "border-line bg-white hover:border-ink"
                  }`}
                  aria-label={r.item.done ? "Marcar pendiente" : "Marcar hecho"}
                >
                  {r.item.done ? "✓" : ""}
                </button>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm leading-snug break-words ${
                      muted ? "line-through text-muted" : "text-ink"
                    }`}
                  >
                    <Highlight text={r.item.text} q={q} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 max-w-[180px]"
                      style={{
                        backgroundColor: `${color}1A`,
                        color,
                      }}
                      title={email}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate font-medium">{shortEmail}</span>
                    </span>
                    {r.noteTitle ? (
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0" aria-hidden>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="truncate max-w-[160px]" title={r.noteTitle}>
                          {r.noteTitle}
                        </span>
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {fmtDate(r.noteDate)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-mint text-ink rounded px-0.5">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
