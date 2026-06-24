"use client";

import { useState } from "react";
import { toggleTodoAction } from "./actions";
import type { TodoItem } from "./types";

export function TodoList({
  noteId,
  blockId,
  items,
  q,
}: {
  noteId: string;
  blockId: string;
  items: TodoItem[];
  q?: string;
}) {
  const [local, setLocal] = useState<TodoItem[]>(items);

  function toggle(id: string) {
    let nextDone = false;
    setLocal((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        nextDone = !it.done;
        return { ...it, done: nextDone };
      }),
    );
    // Fire-and-forget: la UI ya se actualizó.
    void toggleTodoAction(noteId, blockId, id, nextDone);
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {local.map((it) => (
        <li key={it.id} className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => toggle(it.id)}
            aria-label={it.done ? "Marcar pendiente" : "Marcar hecho"}
            className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center text-[10px] shrink-0 transition-colors ${
              it.done
                ? "bg-electric border-electric text-paper"
                : "border-line bg-white hover:border-ink"
            }`}
          >
            {it.done ? "✓" : ""}
          </button>
          <span className={`text-sm ${it.done ? "line-through text-muted" : "text-ink"}`}>
            {q ? <Highlight text={it.text} q={q} /> : it.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-mint text-ink rounded px-0.5">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
