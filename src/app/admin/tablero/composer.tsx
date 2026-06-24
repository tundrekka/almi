"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  appendBlocksAction,
  createNoteAction,
  updateBlockGroupAction,
  updateNoteAction,
  uploadMediaAction,
} from "./actions";
import { Spinner } from "./spinner";
import { TagPicker } from "./tag-picker";
import type { DevBlock, TodoItem } from "./types";

type DraftMeta = { id: string; group?: string; author?: string; at?: string; tags?: string[] };
type DraftBlock =
  | (DraftMeta & { kind: "text"; text: string })
  | (DraftMeta & { kind: "link"; url: string; label: string })
  | (DraftMeta & {
      kind: "image" | "audio" | "file";
      path?: string;
      name?: string;
      mime?: string;
      size?: number;
      uploading?: boolean;
      error?: string;
    })
  | (DraftMeta & { kind: "todo"; items: TodoItem[] });

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function devBlockToDraft(b: DevBlock): DraftBlock {
  const meta = { id: b.id, group: b.group, author: b.author, at: b.at, tags: b.tags };
  if (b.kind === "text") return { ...meta, kind: "text", text: b.text };
  if (b.kind === "link")
    return { ...meta, kind: "link", url: b.url, label: b.label ?? "" };
  if (b.kind === "image" || b.kind === "audio" || b.kind === "file")
    return {
      ...meta,
      kind: b.kind,
      path: b.path,
      name: b.name,
      mime: b.mime,
      size: b.kind === "file" ? b.size : undefined,
    };
  return { ...meta, kind: "todo", items: b.items };
}

export function Composer({
  existingTags = [],
  noteId,
  initial,
  onSaved,
  onCancel,
  appendToNoteId,
  onAppended,
  editGroup,
}: {
  existingTags?: string[];
  noteId?: string;
  initial?: { title: string | null; blocks: DevBlock[]; tags: string[] };
  onSaved?: () => void;
  onCancel?: () => void;
  // Modo "añadir a una página existente": agrega los bloques al final sin tocar título/tags.
  appendToNoteId?: string;
  onAppended?: () => void;
  // Modo "editar un bloque (grupo)": reemplaza ese grupo en su sitio.
  editGroup?: { noteId: string; groupKey: string };
}) {
  const router = useRouter();
  const isEdit = !!noteId;
  const isAppend = !!appendToNoteId;
  const isEditGroup = !!editGroup;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [blocks, setBlocks] = useState<DraftBlock[]>(
    initial?.blocks
      ? initial.blocks.map((b) => devBlockToDraft(b))
      : [{ id: uid(), kind: "text", text: "" }],
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasUploading = blocks.some(
    (b) => (b.kind === "image" || b.kind === "audio" || b.kind === "file") && b.uploading,
  );

  function add(kind: DraftBlock["kind"]) {
    setError(null);
    setOk(null);
    if (kind === "text") setBlocks((b) => [...b, { id: uid(), kind: "text", text: "" }]);
    else if (kind === "link")
      setBlocks((b) => [...b, { id: uid(), kind: "link", url: "", label: "" }]);
    else if (kind === "image" || kind === "audio" || kind === "file")
      setBlocks((b) => [...b, { id: uid(), kind }]);
    else if (kind === "todo")
      setBlocks((b) => [
        ...b,
        { id: uid(), kind: "todo", items: [{ id: uid(), text: "", done: false }] },
      ]);
  }

  function update(id: string, patch: Partial<DraftBlock>) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...patch } as DraftBlock) : b)));
  }

  function remove(id: string) {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  }

  // Paste de imágenes en cualquier parte del composer.
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) {
            e.preventDefault();
            const newId = uid();
            setBlocks((b) => [
              ...b,
              { id: newId, kind: "image", uploading: true } as DraftBlock,
            ]);
            void onUpload(newId, f);
            return;
          }
        }
      }
    }
    root.addEventListener("paste", onPaste);
    return () => root.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag & drop a nivel de ventana — funciona aunque el usuario suelte sobre
  // un input/textarea (que normalmente cancela el drop nativo).
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    let counter = 0;
    function hasFiles(e: DragEvent) {
      return Array.from(e.dataTransfer?.types ?? []).includes("Files");
    }
    function onEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      counter++;
      setDragging(true);
    }
    function onLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      counter = Math.max(0, counter - 1);
      if (counter === 0) setDragging(false);
    }
    function onOver(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      counter = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      for (const f of files) {
        const newId = uid();
        const kind: "image" | "audio" | "file" = f.type.startsWith("image/")
          ? "image"
          : f.type.startsWith("audio/")
            ? "audio"
            : "file";
        setBlocks((b) => [...b, { id: newId, kind, uploading: true } as DraftBlock]);
        void onUpload(newId, f);
      }
    }
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUpload(blockId: string, file: File) {
    update(blockId, { uploading: true, error: undefined } as Partial<DraftBlock>);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadMediaAction(fd);
    if (res.ok) {
      update(blockId, {
        uploading: false,
        path: res.path,
        name: res.name,
        mime: res.mime,
        size: res.size,
      } as Partial<DraftBlock>);
    } else {
      update(blockId, { uploading: false, error: res.error } as Partial<DraftBlock>);
    }
  }

  async function submit() {
    setError(null);
    setOk(null);

    const cleaned: DevBlock[] = [];
    for (const b of blocks) {
      const meta = { id: b.id, group: b.group, author: b.author, at: b.at, tags: b.tags };
      if (b.kind === "text") {
        const text = b.text.trim();
        if (text) cleaned.push({ ...meta, kind: "text", text });
      } else if (b.kind === "link") {
        const url = b.url.trim();
        if (url) cleaned.push({ ...meta, kind: "link", url, label: b.label.trim() || undefined });
      } else if (b.kind === "image" || b.kind === "audio") {
        if (b.path)
          cleaned.push({ ...meta, kind: b.kind, path: b.path, name: b.name, mime: b.mime });
      } else if (b.kind === "file") {
        if (b.path)
          cleaned.push({
            ...meta,
            kind: "file",
            path: b.path,
            name: b.name,
            mime: b.mime,
            size: b.size,
          });
      } else if (b.kind === "todo") {
        const items = b.items.map((i) => ({ ...i, text: i.text.trim() })).filter((i) => i.text);
        if (items.length) cleaned.push({ ...meta, kind: "todo", items });
      }
    }
    if (cleaned.length === 0) {
      setError("Agrega al menos un bloque con contenido.");
      return;
    }

    if (isAppend && appendToNoteId) {
      startTransition(async () => {
        const res = await appendBlocksAction(appendToNoteId, cleaned, tags);
        if (res?.error) setError(res.error);
        else {
          setOk(res?.ok ?? "Añadido.");
          setBlocks([{ id: uid(), kind: "text", text: "" }]);
          setTags([]);
          router.refresh();
          onAppended?.();
        }
      });
      return;
    }

    if (isEditGroup && editGroup) {
      startTransition(async () => {
        const res = await updateBlockGroupAction(
          editGroup.noteId,
          editGroup.groupKey,
          cleaned,
          tags,
        );
        if (res?.error) setError(res.error);
        else {
          setOk(res?.ok ?? "Guardado.");
          router.refresh();
          onSaved?.();
        }
      });
      return;
    }

    const fd = new FormData();
    fd.set("title", title);
    fd.set("blocks", JSON.stringify(cleaned));
    fd.set("tags", JSON.stringify(tags));
    if (isEdit && noteId) fd.set("id", noteId);

    startTransition(async () => {
      const res = isEdit
        ? await updateNoteAction(undefined, fd)
        : await createNoteAction(undefined, fd);
      if (res?.error) setError(res.error);
      else {
        setOk(res?.ok ?? "Guardado.");
        if (isEdit) {
          router.refresh();
          onSaved?.();
        } else {
          setTitle("");
          setTags([]);
          setBlocks([{ id: uid(), kind: "text", text: "" }]);
        }
      }
    });
  }

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      className="relative rounded-2xl border border-line bg-white p-4 flex flex-col gap-3 outline-none"
    >
      {dragging ? (
        <div className="pointer-events-none fixed inset-0 z-40 bg-electric/10 backdrop-blur-[2px] flex items-center justify-center">
          <div className="rounded-2xl border-2 border-dashed border-electric bg-white px-8 py-6 text-center shadow-lg">
            <div className="text-2xl">⬇️</div>
            <div className="mt-1 font-semibold text-ink">Suelta para subir</div>
            <div className="text-xs text-muted">
              Imágenes, audio o documentos (PDF, Word, Excel, etc.)
            </div>
          </div>
        </div>
      ) : null}
      {!isAppend && !isEditGroup ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          className="h-10 rounded-xl border border-line px-3 text-sm focus:outline-none focus:border-ink"
        />
      ) : null}

      {/* Los tags son del bloque; en el editor completo (modo edición) se ocultan. */}
      {!isEdit ? (
        <TagPicker selected={tags} existing={existingTags} onChange={setTags} />
      ) : null}

      <div className="flex flex-col gap-3">
        {blocks.map((b, i) => (
          <BlockEditor
            key={b.id}
            block={b}
            index={i}
            onUpdate={(p) => update(b.id, p)}
            onRemove={() => remove(b.id)}
            onUpload={(file) => {
              if (b.kind === "image" || b.kind === "audio") void onUpload(b.id, file);
            }}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-line">
        <ToolBtn onClick={() => add("text")} icon={<IconText />}>Texto</ToolBtn>
        <ToolBtn onClick={() => add("link")} icon={<IconLink />}>Link</ToolBtn>
        <ToolBtn onClick={() => add("image")} icon={<IconImage />}>Imagen</ToolBtn>
        <ToolBtn onClick={() => add("audio")} icon={<IconAudio />}>Audio</ToolBtn>
        <ToolBtn onClick={() => add("file")} icon={<IconFile />}>Documento</ToolBtn>
        <ToolBtn onClick={() => add("todo")} icon={<IconCheck />}>To dos</ToolBtn>
        <div className="ml-auto flex items-center gap-2">
          {error ? <span className="text-xs text-[#9F1A1A]">{error}</span> : null}
          {ok ? <span className="text-xs text-electric">✓ {ok}</span> : null}
          {(isEdit || isEditGroup) && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="h-10 px-4 rounded-full border border-line text-sm hover:bg-paper disabled:opacity-60"
            >
              Cancelar
            </button>
          ) : null}
          <button
            onClick={submit}
            disabled={pending || hasUploading}
            className="h-10 px-5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-electric disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {pending ? <Spinner className="h-4 w-4" /> : null}
            {pending
              ? isAppend
                ? "Añadiendo…"
                : "Guardando…"
              : hasUploading
                ? "Esperando subida…"
                : isAppend
                  ? "Añadir a la página"
                  : isEdit || isEditGroup
                    ? "Guardar cambios"
                    : "Publicar bloque"}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-muted">
        Tip: usa <code>#etiquetas</code> en el texto. Pega imágenes con{" "}
        <kbd>⌘/Ctrl + V</kbd> o suéltalas en el área para subirlas automáticamente.
      </p>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 inline-flex items-center gap-1.5 pl-2.5 pr-3 rounded-full border border-line text-sm text-ink hover:bg-paper hover:border-ink transition-colors"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-paper text-muted">
        <span aria-hidden className="text-[13px] leading-none font-semibold">
          +
        </span>
      </span>
      {icon ? <span className="text-muted">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

function IconText() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71" />
    </svg>
  );
}
function IconImage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
function IconAudio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function BlockEditor({
  block,
  index,
  onUpdate,
  onRemove,
  onUpload,
}: {
  block: DraftBlock;
  index: number;
  onUpdate: (p: Partial<DraftBlock>) => void;
  onRemove: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper/40 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted">
        <span>
          #{index + 1} · {block.kind}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted hover:text-[#9F1A1A]"
          aria-label="Eliminar bloque"
        >
          Eliminar
        </button>
      </div>

      {block.kind === "text" ? (
        <textarea
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value } as Partial<DraftBlock>)}
          placeholder="Escribe… puedes usar #tags"
          rows={3}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:border-ink resize-y"
        />
      ) : block.kind === "link" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={block.url}
            onChange={(e) => onUpdate({ url: e.target.value } as Partial<DraftBlock>)}
            placeholder="https://…"
            className="sm:col-span-2 h-10 rounded-lg border border-line bg-white px-3 text-sm focus:outline-none focus:border-ink"
          />
          <input
            value={block.label}
            onChange={(e) => onUpdate({ label: e.target.value } as Partial<DraftBlock>)}
            placeholder="Etiqueta (opcional)"
            className="h-10 rounded-lg border border-line bg-white px-3 text-sm focus:outline-none focus:border-ink"
          />
        </div>
      ) : block.kind === "image" || block.kind === "audio" || block.kind === "file" ? (
        <MediaBlockEditor block={block} onUpload={onUpload} />
      ) : block.kind === "todo" ? (
        <TodoEditor
          items={block.items}
          onChange={(items) => onUpdate({ items } as Partial<DraftBlock>)}
        />
      ) : null}
    </div>
  );
}

function MediaBlockEditor({
  block,
  onUpload,
}: {
  block: Extract<DraftBlock, { kind: "image" | "audio" | "file" }>;
  onUpload: (file: File) => void;
}) {
  function handleFiles(files: FileList | File[] | null | undefined) {
    if (!files) return;
    const f = (files as File[])[0] ?? (files as FileList).item?.(0);
    if (f) onUpload(f);
  }

  const accept =
    block.kind === "image" ? "image/*" : block.kind === "audio" ? "audio/*" : undefined;
  const hint =
    block.kind === "image"
      ? "Selecciona una imagen (o arrastra/pega en cualquier parte):"
      : block.kind === "audio"
        ? "Selecciona un audio (o arrastra en cualquier parte):"
        : "Selecciona un documento PDF, Word, Excel, etc. (o arrastra en cualquier parte):";

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border-2 border-dashed px-3 py-3 transition-colors ${
        block.uploading
          ? "border-electric bg-electric/5"
          : block.path
            ? "border-mint bg-mint/20"
            : block.error
              ? "border-[#9F1A1A] bg-[#FEECEC]"
              : "border-line bg-white"
      }`}
    >
      <div className="text-xs text-muted">{hint}</div>
      <input
        type="file"
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={block.uploading}
        className="text-sm disabled:opacity-60"
      />
      {block.uploading ? (
        <span className="inline-flex items-center gap-2 text-xs text-electric font-medium">
          <Spinner className="h-3.5 w-3.5" />
          Subiendo…
        </span>
      ) : null}
      {block.path && !block.uploading ? (
        <span className="text-xs text-ink font-medium">✓ {block.name}</span>
      ) : null}
      {block.error ? <span className="text-xs text-[#9F1A1A]">{block.error}</span> : null}
    </div>
  );
}

function TodoEditor({
  items,
  onChange,
}: {
  items: TodoItem[];
  onChange: (items: TodoItem[]) => void;
}) {
  function patch(idx: number, p: Partial<TodoItem>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...p } : it)));
  }
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((it, i) => (
        <div key={it.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={it.done}
            onChange={(e) => patch(i, { done: e.target.checked })}
          />
          <input
            value={it.text}
            onChange={(e) => patch(i, { text: e.target.value })}
            placeholder="Item…"
            className="flex-1 h-9 rounded-lg border border-line bg-white px-3 text-sm focus:outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-xs text-muted hover:text-[#9F1A1A]"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { id: uid(), text: "", done: false }])}
        className="self-start h-8 px-3 text-xs rounded-full border border-line hover:bg-white"
      >
        + Item
      </button>
    </div>
  );
}
