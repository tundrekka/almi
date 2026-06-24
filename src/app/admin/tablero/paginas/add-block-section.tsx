"use client";

import { useRef, useState } from "react";
import { Composer } from "../composer";

export function AddBlockSection({
  noteId,
  existingTags,
}: {
  noteId: string;
  existingTags: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function openIt() {
    setOpen(true);
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const field = ref.current?.querySelector("textarea, input") as HTMLElement | null;
      field?.focus({ preventScroll: true });
    }, 60);
  }

  return (
    <>
      <div ref={ref} className="scroll-mt-20">
        {open ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted">
                Añadir bloque
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-muted hover:text-ink cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <Composer appendToNoteId={noteId} existingTags={existingTags} />
          </div>
        ) : (
          <button
            type="button"
            onClick={openIt}
            className="w-full h-11 rounded-xl border border-dashed border-line text-sm text-muted hover:text-ink hover:border-ink transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="text-base leading-none">+</span> Añadir bloque
          </button>
        )}
      </div>

      {!open ? (
        <button
          type="button"
          onClick={openIt}
          aria-label="Añadir bloque"
          className="fixed bottom-6 right-6 z-40 h-12 pl-4 pr-5 rounded-full bg-ink text-paper shadow-lg hover:bg-electric inline-flex items-center gap-2 text-sm font-medium cursor-pointer"
        >
          <span className="text-lg leading-none">+</span> Añadir bloque
        </button>
      ) : null}
    </>
  );
}
