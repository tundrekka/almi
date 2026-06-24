"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/tablero", label: "Tablero" },
];

export function AdminMenu({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="h-9 w-9 -ml-1 inline-flex items-center justify-center rounded-lg text-ink hover:bg-white cursor-pointer"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
          <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />
        </svg>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-ink/30"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <nav className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-paper border-r border-line shadow-xl flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.24em] text-muted">
                Administración
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-white cursor-pointer text-lg leading-none"
              >
                ×
              </button>
            </div>

            {ITEMS.map((it) => {
              const active =
                it.href === "/admin" ? pathname === it.href : pathname?.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                    active ? "bg-white text-ink font-medium" : "text-ink/70 hover:text-ink hover:bg-white"
                  }`}
                >
                  {it.label}
                </Link>
              );
            })}

            <div className="mt-auto border-t border-line pt-4">
              <div className="px-3 text-xs text-muted truncate" title={email ?? ""}>
                {email}
              </div>
              <form action="/auth/signout" method="post" className="mt-1">
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
