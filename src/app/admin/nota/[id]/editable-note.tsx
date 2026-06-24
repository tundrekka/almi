"use client";

import { useState } from "react";
import { Composer } from "../../tablero/composer";
import type { AuthorInfo } from "../../tablero/lib";
import { NoteCard } from "../../tablero/note-card";
import type { DevNote } from "../../tablero/types";

export function EditableNote({
  note,
  author,
  signedUrls,
  existingTags,
}: {
  note: DevNote;
  author: AuthorInfo | undefined;
  signedUrls: Record<string, string>;
  existingTags: string[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-electric font-semibold">
            Editando
          </span>
        </div>
        <Composer
          existingTags={existingTags}
          noteId={note.id}
          initial={{ title: note.title, blocks: note.blocks, tags: note.tags }}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="h-9 px-4 rounded-full border border-line text-sm hover:bg-paper"
        >
          Editar
        </button>
      </div>
      <NoteCard note={note} author={author} signedUrls={signedUrls} />
    </div>
  );
}
