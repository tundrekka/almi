import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Resumen general</h1>
      <div className="mt-8 rounded-2xl border border-dashed border-line bg-white/60 p-8 text-sm text-muted">
        Panel de administración de Zalut.{" "}
        <Link href="/admin/tablero" className="text-electric hover:underline">
          Ir a Tablero →
        </Link>
      </div>
    </div>
  );
}
