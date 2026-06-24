import Link from "next/link";
import type { ReactNode } from "react";

export function SectionShell({
  eyebrow,
  title,
  description,
  children,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {back ? (
          <Link href={back.href} className="text-sm text-muted hover:text-ink transition-colors">
            ← {back.label}
          </Link>
        ) : null}
        {eyebrow ? (
          <div className="mt-2 text-xs uppercase tracking-[0.18em] text-electric font-semibold">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">{title}</h1>
        {description ? <p className="mt-3 text-muted max-w-2xl">{description}</p> : null}
        <div className="mt-10">
          {children ?? (
            <div className="rounded-2xl border border-dashed border-line bg-white/60 p-10 text-center text-sm text-muted">
              Pendiente — aquí va la implementación de esta sección.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
