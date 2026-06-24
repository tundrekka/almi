"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBlockAction } from "../actions";
import { Composer } from "../composer";
import type { DevBlock } from "../types";

export function EditableBlock({
  noteId,
  groupKey,
  blocks,
  tags,
  existingTags,
  color,
  email,
  date,
  children,
}: {
  noteId: string;
  groupKey: string;
  blocks: DevBlock[];
  tags: string[];
  existingTags: string[];
  color: string;
  email: string;
  date: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  function remove() {
    if (!confirm("¿Eliminar este bloque?")) return;
    start(async () => {
      await deleteBlockAction(noteId, groupKey);
      router.refresh();
    });
  }

  // Clic en el contenido → editar. Pero respeta los elementos interactivos
  // (links, checkboxes, imágenes, audio) para que sigan funcionando.
  function onBodyClick(e: React.MouseEvent) {
    const el = e.target as HTMLElement;
    if (el.closest('a, button, input, textarea, label, audio, img, [role="button"]')) return;
    if (window.getSelection()?.toString()) return; // permite seleccionar texto
    setEditing(true);
  }

  return (
    <div
      className="group relative rounded-xl border bg-white p-4 flex flex-col gap-2 transition-colors hover:border-ink/25"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      {editing ? (
        <Composer
          editGroup={{ noteId, groupKey }}
          initial={{ title: null, blocks, tags }}
          existingTags={existingTags}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-muted min-w-0">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate" style={{ color }}>
                {email}
              </span>
              <span className="shrink-0">· {date}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-muted hover:text-ink cursor-pointer"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="text-xs text-[#9F1A1A] hover:underline cursor-pointer disabled:opacity-50"
              >
                Borrar
              </button>
            </div>
          </div>
          <div onClick={onBodyClick} className="cursor-text">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
