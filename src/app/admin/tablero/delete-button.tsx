"use client";

import { useTransition } from "react";
import { deleteNoteAction } from "./actions";
import { Spinner } from "./spinner";

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (pending) return;
    const ok = window.confirm(
      "¿Eliminar esta nota? Se borrarán también las imágenes, audios y documentos asociados. Esta acción no se puede deshacer.",
    );
    if (!ok) return;
    const fd = new FormData();
    fd.set("id", noteId);
    startTransition(async () => {
      await deleteNoteAction(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={pending ? "Eliminando…" : "Eliminar nota"}
      aria-label="Eliminar nota"
      className="h-9 w-9 rounded-full border border-line bg-white text-muted hover:text-[#9F1A1A] hover:border-[#9F1A1A] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
    >
      {pending ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      )}
    </button>
  );
}
