"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUBTABS = [
  { href: "/admin/tablero/ajustes", label: "Cuenta" },
  { href: "/admin/tablero/ajustes/zalut", label: "Información de Zalut" },
];

export function AjustesTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1.5">
      {SUBTABS.map((t) => {
        const active =
          t.href === "/admin/tablero/ajustes"
            ? pathname === t.href
            : pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`h-8 inline-flex items-center px-3 rounded-full text-sm transition-colors ${
              active
                ? "bg-ink text-paper border border-ink"
                : "bg-white border border-line text-muted hover:text-ink hover:border-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
