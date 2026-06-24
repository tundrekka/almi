import Link from "next/link";
import { getSessionUser } from "@/lib/auth/dal";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage() {
  const user = await getSessionUser();

  return (
    <main className="min-h-screen grid place-items-center bg-paper px-6 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-line p-8 sm:p-10 shadow-sm">
        <div className="size-10 rounded-xl bg-ink text-paper grid place-items-center font-bold mb-6">
          R
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva contraseña</h1>
        {user ? (
          <>
            <p className="mt-2 text-sm text-muted">
              Define una nueva contraseña para <strong>{user.email}</strong>.
            </p>
            <div className="mt-8">
              <ResetForm />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              El enlace expiró o no es válido. Solicita uno nuevo.
            </p>
            <Link
              href="/auth/forgot"
              className="mt-6 inline-flex h-11 px-5 items-center rounded-full bg-ink text-paper text-sm font-medium hover:bg-electric"
            >
              Pedir enlace nuevo
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
