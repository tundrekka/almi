"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { authAction } from "../actions";

export function LoginForm({
  next,
  initialMode = "signin",
}: {
  next?: string;
  initialMode?: "signin" | "signup";
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [submittedMode, setSubmittedMode] = useState<"signin" | "signup" | null>(null);
  const [state, formAction, pending] = useActionState(authAction, undefined);
  // Si el usuario cambió de modo después de un error, oculta el error viejo.
  const showError = !!state?.error && submittedMode === mode;

  return (
    <div>
      <div className="flex rounded-full bg-paper p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 h-9 rounded-full transition-colors ${
            mode === "signin" ? "bg-ink text-paper" : "text-muted hover:text-ink"
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 h-9 rounded-full transition-colors ${
            mode === "signup" ? "bg-ink text-paper" : "text-muted hover:text-ink"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form
        action={formAction}
        onSubmit={() => setSubmittedMode(mode)}
        className="mt-6 flex flex-col gap-4"
      >
        <input type="hidden" name="mode" value={mode} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Correo</span>
          <input
            type="email"
            name="email"
            required
            placeholder="tu@correo.com"
            className="h-11 rounded-xl border border-line bg-white px-3 focus:outline-none focus:border-ink"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">Contraseña</span>
            {mode === "signin" ? (
              <Link
                href="/auth/forgot"
                className="text-xs text-electric hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            ) : null}
          </div>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            placeholder="mínimo 6 caracteres"
            className="h-11 rounded-xl border border-line bg-white px-3 focus:outline-none focus:border-ink"
          />
        </label>

        {showError && state?.error ? (
          <div className="rounded-xl bg-[#FEECEC] text-[#9F1A1A] text-sm px-3 py-2 flex flex-col gap-2">
            <span>{state.error}</span>
            {state.code === "already_registered" ? (
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-ink underline font-medium"
                >
                  Ir a Ingresar
                </button>
                <Link href="/auth/forgot" className="text-electric underline">
                  Recuperar contraseña
                </Link>
              </div>
            ) : null}
            {state.code === "invalid_credentials" ? (
              <Link
                href="/auth/forgot"
                className="text-xs text-electric underline self-start"
              >
                Recuperar contraseña
              </Link>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-full bg-ink text-paper font-medium hover:bg-electric transition-colors disabled:opacity-60"
        >
          {pending
            ? "Conectando…"
            : mode === "signin"
              ? "Ingresar"
              : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
