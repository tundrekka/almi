import { BlockView, highlight } from "./block-view";
import { DeleteNoteButton } from "./delete-button";
import type { AuthorInfo } from "./lib";
import { ShareButton } from "./share-button";
import type { DevBlock, DevNote } from "./types";

function fmtDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NoteCard({
  note,
  author,
  signedUrls,
  kindFilter = "",
  q = "",
}: {
  note: DevNote;
  author: AuthorInfo | undefined;
  signedUrls: Record<string, string>;
  kindFilter?: string;
  q?: string;
}) {
  const visibleBlocks = kindFilter
    ? (note.blocks as DevBlock[]).filter((b) => b.kind === kindFilter)
    : (note.blocks as DevBlock[]);

  const color = author?.color ?? "#9CA3AF";
  const email = author?.email ?? "—";
  const initials = (email[0] ?? "?").toUpperCase();

  return (
    <article
      className="rounded-2xl border bg-white p-4 flex flex-col gap-3"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: color }}
            title={email}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium" style={{ color }} title={email}>
                {email}
              </span>
              <span className="text-xs text-muted">{fmtDate(note.created_at)}</span>
            </div>
            {note.title ? (
              <h3 className="font-semibold text-ink truncate">
                {highlight(note.title, q)}
              </h3>
            ) : null}
            {note.tags.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {note.tags.map((t) => (
                  <a
                    key={t}
                    href={`/admin/tablero/feed?tag=${encodeURIComponent(t)}`}
                    className="text-[11px] px-1.5 py-0.5 rounded-full bg-paper border border-line text-muted hover:text-ink"
                  >
                    #{t}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ShareButton noteId={note.id} />
          <DeleteNoteButton noteId={note.id} />
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {visibleBlocks.map((b) => (
          <BlockView key={b.id} block={b} noteId={note.id} signedUrls={signedUrls} q={q} />
        ))}
      </div>
    </article>
  );
}
