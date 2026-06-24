import Link from "next/link";
import { BlockView, highlight } from "./block-view";
import type { AuthorInfo } from "./lib";
import { ShareButton } from "./share-button";
import type { DevBlock, DevNote } from "./types";

function fmtDate(s: string): string {
  return new Date(s).toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Una tarjeta = un bloque (grupo). La página es solo el contenedor; en el feed
// cada bloque aparece como entrada distinta, con su página de origen como contexto.
export function BlockGroupCard({
  note,
  blocks,
  author,
  date,
  signedUrls,
  q = "",
}: {
  note: DevNote;
  blocks: DevBlock[];
  author: AuthorInfo | undefined;
  date: string;
  signedUrls: Record<string, string>;
  q?: string;
}) {
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
              <span className="text-xs text-muted">{fmtDate(date)}</span>
            </div>
            <Link
              href={`/admin/tablero/paginas/${note.id}`}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
            >
              <span>{note.icon ?? "📄"}</span>
              <span className="truncate max-w-[18rem]">
                {highlight(note.title ?? "Sin título", q)}
              </span>
            </Link>
          </div>
        </div>
        <ShareButton noteId={note.id} />
      </header>

      <div className="flex flex-col gap-3">
        {blocks.map((b) => (
          <BlockView key={b.id} block={b} noteId={note.id} signedUrls={signedUrls} q={q} />
        ))}
      </div>

      {(blocks[0]?.tags ?? []).length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {(blocks[0].tags ?? []).map((t) => (
            <Link
              key={t}
              href={`/admin/tablero/feed?tag=${encodeURIComponent(t)}`}
              className="text-[11px] px-1.5 py-0.5 rounded-full bg-paper border border-line text-muted hover:text-ink"
            >
              #{t}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}
