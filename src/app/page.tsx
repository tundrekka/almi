import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/dal";
import { Wordmark } from "@/components/wordmark";

// Panel de administración interno.
// - Sin sesión  → login
// - Admin       → directo al tablero
// - Logueado sin rol admin → página terminal (NO redirige, para no hacer bucle
//   con requireRole(), que manda a "/" a quien no es admin).
export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  if (user.role === "admin") redirect("/admin/tablero");

  return (
    <main className="min-h-screen grid place-items-center bg-paper px-6 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-line p-8 sm:p-10 shadow-sm text-center">
        <div className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-3 mb-6">
          <Wordmark className="text-xl text-paper" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Sin acceso de admin</h1>
        <p className="mt-2 text-sm text-muted">
          Tu cuenta ({user.email}) no tiene rol <code>admin</code>. Pídele a un
          administrador que te lo asigne para entrar al panel.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="h-11 px-5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-electric transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
        <div className="mt-4">
          <Link href="/admin/tablero" className="text-xs text-electric hover:underline">
            Reintentar acceso al panel
          </Link>
        </div>
      </div>
    </main>
  );
}
