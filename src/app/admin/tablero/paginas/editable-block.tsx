"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBlockAction } from "../actions";
import { Composer } from "../composer";
import type { DevBlock } from "../types";
import { useCollapse } from "./blocks-collapse";
import type { PageOption } from "./blocks-collapse";

// Tope (px) a partir del cual un bloque colapsado muestra el desvanecido y el
// botón "Expandir". Debe coincidir con `.block-collapsed { max-height }` en CSS.
const COLLAPSE_CAP = 168;

export function EditableBlock({
  noteId,
  groupKey,
  blocks,
  tags,
  existingTags,
  pages,
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
  pages: PageOption[];
  color: string;
  email: string;
  date: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const collapseCtx = useCollapse();
  const [editing, setEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(collapseCtx?.defaultCollapsed ?? true);
  const [pending, start] = useTransition();

  // Reacciona a "expandir/colapsar todo" ajustando el estado en render (patrón
  // recomendado para sincronizar con un valor externo, sin efecto).
  const cmdV = collapseCtx?.command?.v ?? 0;
  const [seenCmd, setSeenCmd] = useState(0);
  if (cmdV !== seenCmd && collapseCtx?.command) {
    setSeenCmd(cmdV);
    setCollapsed(collapseCtx.command.collapsed);
  }

  // ¿El bloque se beneficia de colapsarse? Sí si su contenido excede el tope o
  // contiene imágenes (que se miniaturizan al colapsar). Se mide en vivo porque
  // las imágenes cargan de forma asíncrona.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [compactable, setCompactable] = useState(false);
  const [overflowsCap, setOverflowsCap] = useState(false);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      const overflows = el.scrollHeight > COLLAPSE_CAP + 8;
      const hasImg = el.querySelector("img") !== null;
      setOverflowsCap(overflows);
      setCompactable(overflows || hasImg);
    };
    measure();
    const imgs = Array.from(el.querySelectorAll("img"));
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure);
    });
    window.addEventListener("resize", measure);
    return () => {
      imgs.forEach((img) => img.removeEventListener("load", measure));
      window.removeEventListener("resize", measure);
    };
  }, [children, editing]);

  function remove() {
    if (!confirm("¿Eliminar este bloque?")) return;
    start(async () => {
      await deleteBlockAction(noteId, groupKey);
      router.refresh();
    });
  }

  const showCollapsed = collapsed && compactable;

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
          pages={pages}
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
            <div className="flex items-center gap-3 shrink-0">
              {compactable ? (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => !c)}
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink cursor-pointer"
                >
                  {collapsed ? "Expandir" : "Colapsar"}
                  <span aria-hidden className="text-[10px]">
                    {collapsed ? "▾" : "▴"}
                  </span>
                </button>
              ) : null}
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
          </div>
          <div
            ref={bodyRef}
            className={`${showCollapsed ? "block-collapsed" : ""} ${
              showCollapsed && overflowsCap ? "block-collapsed--fade" : ""
            }`}
          >
            {children}
          </div>
          {showCollapsed && overflowsCap ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="self-start -mt-1 text-xs text-muted hover:text-ink cursor-pointer"
            >
              Ver más ▾
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
