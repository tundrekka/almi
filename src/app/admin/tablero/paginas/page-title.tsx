"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renamePageAction } from "../actions";

const PRESET_EMOJI = [
  "📄", "📦", "🌐", "📧", "💡", "🚀", "🛠️", "💰", "📊", "🔑",
  "🏬", "🛒", "📝", "⭐", "🔥", "📌", "🎯", "🧾", "🤝", "⚙️",
];

export function PageTitle({
  noteId,
  initialIcon,
  initialTitle,
}: {
  noteId: string;
  initialIcon: string;
  initialTitle: string;
}) {
  const router = useRouter();
  const [icon, setIcon] = useState(initialIcon);
  const [title, setTitle] = useState(initialTitle);
  const [open, setOpen] = useState(false);

  function commitTitle() {
    const next = title.trim() || "Sin título";
    if (next !== initialTitle) {
      void renamePageAction(noteId, { title: next }).then(() => router.refresh());
    }
  }

  function pickIcon(next: string) {
    setIcon(next);
    setOpen(false);
    void renamePageAction(noteId, { icon: next }).then(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2 relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-3xl leading-none hover:bg-paper rounded-lg p-1 cursor-pointer"
        title="Cambiar emoji"
      >
        {icon}
      </button>

      {open ? (
        <div className="absolute top-12 left-0 z-20 w-64 rounded-xl border border-line bg-white p-2 shadow-lg">
          <div className="grid grid-cols-8 gap-1">
            {PRESET_EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => pickIcon(e)}
                className="h-7 w-7 rounded-md hover:bg-paper text-lg leading-none cursor-pointer"
              >
                {e}
              </button>
            ))}
          </div>
          <input
            autoFocus
            defaultValue=""
            placeholder="o pega un emoji…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) pickIcon(v);
              }
            }}
            className="mt-2 w-full h-8 rounded-md border border-line px-2 text-sm"
          />
        </div>
      ) : null}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="Sin título"
        className="flex-1 min-w-0 text-2xl font-semibold tracking-tight text-ink bg-transparent focus:outline-none"
      />
    </div>
  );
}
