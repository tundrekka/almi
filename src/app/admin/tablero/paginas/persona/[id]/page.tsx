import Link from "next/link";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { BlockView } from "../../../block-view";
import { loadAuthors, signMediaForNotes } from "../../../lib";
import { groupAt, groupBlocks, type BlockGroup, type DevBlock, type DevNote } from "../../../types";

export const dynamic = "force-dynamic";

export default async function PersonaView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createSupabaseServiceRole();
  const { data } = await supabase
    .from("zalut_dev_notes")
    .select("id, author_id, title, icon, blocks, tags, search_text, edits, created_at, updated_at")
    .eq("author_id", id)
    .order("created_at", { ascending: true })
    .limit(500);

  const notes = (data ?? []) as DevNote[];
  const authors = await loadAuthors([id]);
  const author = authors.get(id);
  const signed = await signMediaForNotes(notes);

  // Agrupa los bloques (por lote de creación) manteniendo su página de origen.
  const entries: { note: DevNote; group: BlockGroup }[] = [];
  for (const n of notes) {
    for (const g of groupBlocks((n.blocks ?? []) as DevBlock[])) {
      entries.push({ note: n, group: g });
    }
  }
  // Más reciente primero, por fecha de creación del bloque.
  entries.sort(
    (a, b) =>
      new Date(groupAt(b.group, b.note.created_at)).getTime() -
      new Date(groupAt(a.group, a.note.created_at)).getTime(),
  );

  return (
    <article className="flex flex-col gap-4 max-w-3xl">
      <header className="flex items-center gap-3">
        <span
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
          style={{ backgroundColor: author?.color ?? "#9CA3AF" }}
        >
          {(author?.email?.[0] ?? "?").toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {author?.email ?? id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted">
            {notes.length} {notes.length === 1 ? "página" : "páginas"} · {entries.length}{" "}
            {entries.length === 1 ? "bloque" : "bloques"}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted py-4">Esta persona aún no tiene bloques.</p>
        ) : (
          entries.map(({ note, group }) => (
            <div
              key={`${note.id}-${group.key}`}
              className="rounded-xl border border-line bg-white p-4 flex flex-col gap-2"
            >
              <Link
                href={`/admin/tablero/paginas/${note.id}`}
                className="self-start text-[11px] text-muted hover:text-ink inline-flex items-center gap-1"
              >
                <span>{note.icon ?? "📄"}</span>
                <span className="truncate max-w-[20rem]">{note.title ?? "Sin título"}</span>
              </Link>
              {group.blocks.map((b) => (
                <BlockView key={b.id} block={b} noteId={note.id} signedUrls={signed} />
              ))}
            </div>
          ))
        )}
      </div>
    </article>
  );
}
