"use client";

import { createContext, useCallback, useContext, useState } from "react";

// Opción de página para el selector de "reasignar bloque" en el editor.
export type PageOption = { id: string; icon: string; title: string };

// Comando de "expandir/colapsar todo": cada vez que se dispara cambia de
// identidad para que los bloques reaccionen vía useEffect.
type Command = { v: number; collapsed: boolean };
type CollapseValue = {
  defaultCollapsed: boolean;
  command: Command | null;
  allCollapsed: boolean;
  setAll: (collapsed: boolean) => void;
};

const CollapseContext = createContext<CollapseValue | null>(null);

export function useCollapse(): CollapseValue | null {
  return useContext(CollapseContext);
}

export function CollapseProvider({
  defaultCollapsed = true,
  children,
}: {
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [command, setCommand] = useState<Command | null>(null);
  const [allCollapsed, setAllCollapsed] = useState(defaultCollapsed);
  const setAll = useCallback((collapsed: boolean) => {
    setAllCollapsed(collapsed);
    setCommand((prev) => ({ v: (prev?.v ?? 0) + 1, collapsed }));
  }, []);
  return (
    <CollapseContext.Provider value={{ defaultCollapsed, command, allCollapsed, setAll }}>
      {children}
    </CollapseContext.Provider>
  );
}

// Botón para expandir/colapsar todos los bloques de la página de una vez
// (útil para búsquedas profundas).
export function CollapseAllToggle() {
  const ctx = useCollapse();
  if (!ctx) return null;
  const expand = ctx.allCollapsed;
  return (
    <button
      type="button"
      onClick={() => ctx.setAll(!ctx.allCollapsed)}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line text-xs text-muted hover:text-ink hover:border-ink transition-colors cursor-pointer"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        {expand ? (
          <>
            <path d="m7 13 5 5 5-5" />
            <path d="m7 6 5 5 5-5" />
          </>
        ) : (
          <>
            <path d="m17 11-5-5-5 5" />
            <path d="m17 18-5-5-5 5" />
          </>
        )}
      </svg>
      {expand ? "Expandir todo" : "Colapsar todo"}
    </button>
  );
}
