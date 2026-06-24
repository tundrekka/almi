"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "../actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
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

      {state?.error ? (
        <div className="rounded-xl bg-[#FEECEC] text-[#9F1A1A] text-sm px-3 py-2">
          {state.error}
        </div>
      ) : null}
      {state?.ok ? (
        <div className="rounded-xl bg-mint text-ink text-sm px-3 py-2">{state.ok}</div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-full bg-ink text-paper font-medium hover:bg-electric transition-colors disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
}
