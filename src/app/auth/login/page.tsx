import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/dal";
import { Wordmark } from "@/components/wordmark";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const user = await getSessionUser();
  const { next, mode } = await searchParams;
  if (user) redirect(next ?? "/");
  const initialMode = mode === "signup" ? "signup" : "signin";

  return (
    <main className="min-h-screen grid place-items-center bg-paper px-6 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-line p-8 sm:p-10 shadow-sm">
        <div className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-3 mb-6">
          <Wordmark className="text-xl text-paper" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Panel de administración</h1>
        <p className="mt-2 text-sm text-muted">
          Acceso restringido al equipo de Zalut. Entra con tu correo.
        </p>
        <div className="mt-8">
          <LoginForm next={next} initialMode={initialMode} />
        </div>
      </div>
    </main>
  );
}
