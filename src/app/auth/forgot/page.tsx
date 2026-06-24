import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-paper px-6 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-line p-8 sm:p-10 shadow-sm">
        <div className="size-10 rounded-xl bg-ink text-paper grid place-items-center font-bold mb-6">
          R
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-muted">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>
        <div className="mt-8">
          <ForgotForm />
        </div>
        <div className="mt-6 text-sm text-muted">
          <Link href="/auth/login" className="text-electric hover:underline">
            ← Volver a ingresar
          </Link>
        </div>
      </div>
    </main>
  );
}
