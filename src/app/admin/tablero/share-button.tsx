"use client";

import { useState } from "react";

export function ShareButton({
  noteId,
  variant = "compact",
}: {
  noteId: string;
  variant?: "compact" | "prominent";
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    const url = `${window.location.origin}/admin/tablero/paginas/${noteId}`;
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2000);
    }
  }

  if (variant === "prominent") {
    return (
      <button
        type="button"
        onClick={copy}
        className={`h-10 inline-flex items-center gap-2 px-4 rounded-full text-sm font-medium transition-colors ${
          state === "copied"
            ? "bg-mint text-ink"
            : state === "error"
              ? "bg-[#FEECEC] text-[#9F1A1A]"
              : "bg-ink text-paper hover:bg-electric"
        }`}
        aria-label="Copiar link"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          {state === "copied" ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71" />
            </>
          )}
        </svg>
        {state === "copied"
          ? "Link copiado"
          : state === "error"
            ? "Error al copiar"
            : "Copiar link"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/admin/tablero/paginas/${noteId}`}
        target="_blank"
        rel="noreferrer noopener"
        title="Abrir página"
        aria-label="Abrir página"
        className="h-9 w-9 rounded-full border border-line bg-white text-muted hover:text-ink hover:border-ink flex items-center justify-center transition-colors cursor-pointer"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
        </svg>
      </a>
      <button
        type="button"
        onClick={copy}
        title={
          state === "copied"
            ? "Copiado"
            : state === "error"
              ? "Error al copiar"
              : "Copiar link"
        }
        aria-label="Copiar link"
        className={`h-9 w-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
          state === "copied"
            ? "bg-mint border-mint text-ink"
            : state === "error"
              ? "bg-[#FEECEC] border-[#FEECEC] text-[#9F1A1A]"
              : "border-line bg-white text-muted hover:text-ink hover:border-ink"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
          {state === "copied" ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
