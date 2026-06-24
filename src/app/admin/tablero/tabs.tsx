"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/tablero", label: "Resumen" },
  { href: "/admin/tablero/feed", label: "Bloques" },
  { href: "/admin/tablero/nuevo", label: "Crear" },
  { href: "/admin/tablero/todos", label: "To dos" },
  { href: "/admin/tablero/ajustes", label: "Ajustes" },
];

export function DevTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-line -mb-px">
      {TABS.map((t) => {
        const active =
          t.href === "/admin/tablero"
            ? pathname === t.href
            : pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-2 text-sm rounded-t-lg border ${
              active
                ? "bg-white border-line border-b-white text-ink font-medium"
                : "border-transparent text-muted hover:text-ink hover:bg-paper"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
