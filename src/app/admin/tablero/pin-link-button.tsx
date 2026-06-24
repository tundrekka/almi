"use client";

import { useState, useTransition } from "react";
import { toggleLinkPinAction } from "./actions";

export function PinLinkButton({
  noteId,
  blockId,
  initialPinned,
}: {
  noteId: string;
  blockId: string;
  initialPinned: boolean;
}) {
  const [pinned, setPinned] = useState(initialPinned);
  const [, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !pinned;
    setPinned(next);
    startTransition(async () => {
      await toggleLinkPinAction(noteId, blockId);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={pinned ? "Quitar de fijados" : "Fijar en Resumen"}
      aria-label={pinned ? "Quitar de fijados" : "Fijar"}
      aria-pressed={pinned}
      className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
        pinned
          ? "bg-electric/15 text-electric hover:bg-electric/25"
          : "text-muted hover:text-ink hover:bg-paper"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={pinned ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M12 17v5" />
        <path d="M9 10.76V6h6v4.76a2 2 0 0 0 1.12 1.8L19 14H5l2.88-1.44A2 2 0 0 0 9 10.76Z" />
      </svg>
    </button>
  );
}
