"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "../actions";

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Nueva contraseña</span>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          placeholder="mínimo 6 caracteres"
          className="h-11 rounded-xl border border-line bg-white px-3 focus:outline-none focus:border-ink"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Confirmar</span>
        <input
          type="password"
          name="confirm"
          required
          minLength={6}
          placeholder="repítela"
          className="h-11 rounded-xl border border-line bg-white px-3 focus:outline-none focus:border-ink"
        />
      </label>

      {state?.error ? (
        <div className="rounded-xl bg-[#FEECEC] text-[#9F1A1A] text-sm px-3 py-2">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-full bg-ink text-paper font-medium hover:bg-electric transition-colors disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
