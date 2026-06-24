"use client";

import { useActionState, useEffect, useState } from "react";
import { Spinner } from "../spinner";
import {
  createInfoAction,
  deleteInfoAction,
  updateInfoAction,
  type ActionState,
} from "./actions";
import {
  CATEGORY_HINT,
  CATEGORY_LABEL,
  CATEGORY_SINGULAR,
  INFO_CATEGORIES,
  type CompanyInfo,
  type InfoCategory,
  type InfoField,
} from "./types";

type AuthorMeta = { email: string | null; color: string };
type Authors = Record<string, AuthorMeta>;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type FormTarget =
  | { mode: "create"; category: InfoCategory }
  | { mode: "edit"; entry: CompanyInfo };

export function ZalutBoard({ entries, authors }: { entries: CompanyInfo[]; authors: Authors }) {
  const [target, setTarget] = useState<FormTarget | null>(null);

  const byCategory = new Map<InfoCategory, CompanyInfo[]>();
  for (const c of INFO_CATEGORIES) byCategory.set(c, []);
  for (const e of entries) {
    if (!byCategory.has(e.category)) byCategory.set(e.category, []);
    byCategory.get(e.category)!.push(e);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Información de Zalut</h2>
          <p className="text-sm text-muted max-w-prose">
            Registro permanente de la empresa: correos y datos que en teoría no cambian.
            Sirve para saber con el tiempo quién creó o registró qué.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTarget({ mode: "create", category: "email" })}
          className="h-10 px-4 rounded-full bg-ink text-paper text-sm font-medium hover:bg-electric cursor-pointer shrink-0"
        >
          + Nuevo
        </button>
      </header>

      {INFO_CATEGORIES.map((cat) => {
        const items = byCategory.get(cat) ?? [];
        return (
          <section key={cat} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-ink flex items-center gap-2">
                  {CATEGORY_LABEL[cat]}
                  <span className="text-xs font-normal text-muted">({items.length})</span>
                </h3>
                <p className="text-xs text-muted">{CATEGORY_HINT[cat]}</p>
              </div>
              <button
                type="button"
                onClick={() => setTarget({ mode: "create", category: cat })}
                className="text-sm text-electric hover:underline cursor-pointer shrink-0"
              >
                + {CATEGORY_SINGULAR[cat]}
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted rounded-2xl border border-dashed border-line px-4 py-6 text-center">
                Sin entradas todavía.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((e) => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    authors={authors}
                    onEdit={() => setTarget({ mode: "edit", entry: e })}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {target ? (
        <EntryDialog target={target} onClose={() => setTarget(null)} />
      ) : null}
    </div>
  );
}

function EntryCard({
  entry,
  authors,
  onEdit,
}: {
  entry: CompanyInfo;
  authors: Authors;
  onEdit: () => void;
}) {
  const author = authors[entry.author_id];
  const lastEdit = entry.edits?.[entry.edits.length - 1];

  return (
    <article className="rounded-2xl border border-line bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-ink break-words">{entry.title}</h4>
          {entry.subtitle ? (
            <p className="text-sm text-muted break-words">{entry.subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-muted hover:text-ink cursor-pointer"
          >
            Editar
          </button>
          <DeleteButton id={entry.id} title={entry.title} />
        </div>
      </div>

      {entry.fields.length > 0 ? (
        <dl className="flex flex-col divide-y divide-line/60 rounded-xl border border-line/60 overflow-hidden">
          {entry.fields.map((f) => (
            <FieldRow key={f.id} field={f} />
          ))}
        </dl>
      ) : null}

      {entry.notes ? (
        <p className="text-sm text-ink/80 whitespace-pre-wrap break-words border-l-2 border-line pl-3">
          {entry.notes}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        {author ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: author.color }} />
            {author.email ?? "—"}
          </span>
        ) : null}
        <span>Creado {fmtDate(entry.created_at)}</span>
        {lastEdit ? (
          <span>
            · Editado {fmtDate(lastEdit.at)}
            {authors[lastEdit.user_id]?.email ? ` por ${authors[lastEdit.user_id].email}` : ""}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function FieldRow({ field }: { field: InfoField }) {
  const [revealed, setRevealed] = useState(!field.secret);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(field.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // sin permiso de clipboard; ignoramos
    }
  };

  return (
    <div className="flex items-baseline gap-2 px-3 py-2 text-sm">
      <dt className="text-[11px] uppercase tracking-wider text-muted shrink-0 w-28 break-words">
        {field.label}
      </dt>
      <dd className="text-ink break-all flex-1 min-w-0">
        {field.value ? (revealed ? field.value : "••••••••") : <span className="text-muted">—</span>}
      </dd>
      <div className="flex items-center gap-1.5 shrink-0">
        {field.secret && field.value ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="text-[11px] text-muted hover:text-ink cursor-pointer"
          >
            {revealed ? "Ocultar" : "Ver"}
          </button>
        ) : null}
        {field.value ? (
          <button
            type="button"
            onClick={copy}
            className="text-[11px] text-muted hover:text-electric cursor-pointer"
          >
            {copied ? "✓" : "Copiar"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteInfoAction}
      onSubmit={(e) => {
        if (!confirm(`¿Borrar "${title}"? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-[#9F1A1A] hover:underline cursor-pointer">
        Borrar
      </button>
    </form>
  );
}

function EntryDialog({ target, onClose }: { target: FormTarget; onClose: () => void }) {
  const isEdit = target.mode === "edit";
  const entry = isEdit ? target.entry : null;

  const [category, setCategory] = useState<InfoCategory>(
    isEdit ? entry!.category : target.category,
  );
  const [title, setTitle] = useState(entry?.title ?? "");
  const [subtitle, setSubtitle] = useState(entry?.subtitle ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [fields, setFields] = useState<InfoField[]>(
    entry?.fields.length
      ? entry.fields.map((f) => ({ ...f }))
      : [{ id: uid(), label: "", value: "", secret: false }],
  );

  const action = isEdit ? updateInfoAction : createInfoAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);

  // Cierra el diálogo cuando la acción terminó OK.
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  // Cierra con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setField = (id: string, patch: Partial<InfoField>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const addField = () =>
    setFields((prev) => [...prev, { id: uid(), label: "", value: "", secret: false }]);
  const removeField = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));

  const cleanFields = fields.filter((f) => f.label.trim() || f.value.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="font-semibold text-ink">
            {isEdit ? "Editar entrada" : `Nuevo: ${CATEGORY_SINGULAR[category]}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink cursor-pointer text-lg leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-4 p-5">
          {isEdit ? <input type="hidden" name="id" value={entry!.id} /> : null}
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="fields" value={JSON.stringify(cleanFields)} />

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted">Categoría</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as InfoCategory)}
              className="h-10 rounded-lg border border-line px-3 bg-white"
            >
              {INFO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted">Título *</span>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="zalutstore@gmail.com"
              className="h-10 rounded-lg border border-line px-3"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted">
              Subtítulo (opcional)
            </span>
            <input
              name="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Correo principal de la tienda"
              className="h-10 rounded-lg border border-line px-3"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-muted">Campos</span>
            {fields.map((f) => (
              <div key={f.id} className="flex flex-col gap-1.5 rounded-lg border border-line p-2">
                <div className="flex items-center gap-2">
                  <input
                    value={f.label}
                    onChange={(e) => setField(f.id, { label: e.target.value })}
                    placeholder="Etiqueta (ej. Contraseña, Registrador)"
                    className="h-9 flex-1 rounded-md border border-line px-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeField(f.id)}
                    className="text-muted hover:text-[#9F1A1A] cursor-pointer text-sm px-1"
                    aria-label="Quitar campo"
                  >
                    ×
                  </button>
                </div>
                <input
                  value={f.value}
                  onChange={(e) => setField(f.id, { value: e.target.value })}
                  placeholder="Valor"
                  type={f.secret ? "password" : "text"}
                  className="h-9 rounded-md border border-line px-2 text-sm"
                />
                <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!f.secret}
                    onChange={(e) => setField(f.id, { secret: e.target.checked })}
                  />
                  Sensible (ocultar valor por defecto)
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={addField}
              className="self-start text-sm text-electric hover:underline cursor-pointer"
            >
              + Añadir campo
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted">Notas (opcional)</span>
            <textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="El dominio está comprado en Namecheap por… vence el…"
              className="rounded-lg border border-line px-3 py-2 resize-y"
            />
          </label>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="h-10 px-5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-electric disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {pending ? <Spinner className="h-4 w-4" /> : null}
              {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-full text-sm text-muted hover:text-ink cursor-pointer"
            >
              Cancelar
            </button>
            {state?.error ? (
              <span className="text-xs text-[#9F1A1A]">{state.error}</span>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
