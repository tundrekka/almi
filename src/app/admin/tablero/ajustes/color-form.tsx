"use client";

import { useActionState, useState } from "react";
import { setDevColorAction } from "../actions";
import { Spinner } from "../spinner";

const PRESETS = [
  "#E11D48",
  "#2563EB",
  "#16A34A",
  "#D97706",
  "#7C3AED",
  "#0891B2",
  "#DB2777",
  "#65A30D",
  "#EA580C",
  "#0D9488",
  "#111827",
  "#9333EA",
];

export function ColorForm({ initial, email }: { initial: string; email: string }) {
  const [color, setColor] = useState(initial);
  const [state, action, pending] = useActionState(setDevColorAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="color" value={color} />

      <div className="flex items-center gap-3">
        <span
          className="h-10 w-10 rounded-full border border-line"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium" style={{ color }}>
          {email}
        </span>
        <code className="ml-auto text-xs text-muted">{color}</code>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={c}
            className={`h-8 w-8 rounded-full border-2 ${
              color.toLowerCase() === c.toLowerCase() ? "border-ink" : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="h-8 w-8 rounded-full border border-dashed border-line flex items-center justify-center cursor-pointer text-xs text-muted">
          +
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 px-5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-electric disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {pending ? <Spinner className="h-4 w-4" /> : null}
          {pending ? "Guardando…" : "Guardar color"}
        </button>
        {state?.error ? (
          <span className="text-xs text-[#9F1A1A]">{state.error}</span>
        ) : state?.ok ? (
          <span className="text-xs text-electric">✓ {state.ok}</span>
        ) : null}
      </div>
    </form>
  );
}
