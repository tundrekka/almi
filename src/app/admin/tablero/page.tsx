import Link from "next/link";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { BlockGroupCard } from "./block-group-card";
import { loadAuthors, signMediaForNotes, summarize } from "./lib";
import { groupAt, groupAuthorId, groupBlocks, type DevBlock, type DevNote } from "./types";

export const dynamic = "force-dynamic";

export default async function DevResumenPage() {
  const supabase = createSupabaseServiceRole();
  const { data } = await supabase
    .from("zalut_dev_notes")
    .select("id, author_id, title, icon, blocks, tags, search_text, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const notes: DevNote[] = (data ?? []) as DevNote[];

  // Todos los bloques (grupos) de todas las páginas, con su autor y fecha.
  const all: {
    note: DevNote;
    key: string;
    blocks: DevBlock[];
    authorId: string;
    date: string;
  }[] = [];
  for (const n of notes) {
    for (const g of groupBlocks((n.blocks ?? []) as DevBlock[])) {
      all.push({
        note: n,
        key: g.key,
        blocks: g.blocks,
        authorId: groupAuthorId(g, n.author_id),
        date: groupAt(g, n.created_at),
      });
    }
  }
  all.sort((a, b) => b.date.localeCompare(a.date));
  const recent = all.slice(0, 3);

  const authors = await loadAuthors(recent.map((e) => e.authorId));
  const signed = await signMediaForNotes(notes);

  const summary = summarize(notes);
  const cards: { label: string; value: number; href: string }[] = [
    { label: "Bloques", value: all.length, href: "/admin/tablero/feed" },
    { label: "Texto", value: summary.text, href: "/admin/tablero/feed?kind=text" },
    { label: "Links", value: summary.link, href: "/admin/tablero/feed?kind=link" },
    { label: "Imágenes", value: summary.image, href: "/admin/tablero/feed?kind=image" },
    { label: "Audio", value: summary.audio, href: "/admin/tablero/feed?kind=audio" },
    { label: "Docs", value: summary.file, href: "/admin/tablero/feed?kind=file" },
    {
      label: `To dos (${summary.todoOpen} pend.)`,
      value: summary.todoOpen + summary.todoDone,
      href: "/admin/tablero/todos",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-line bg-white p-3 hover:border-ink/30 transition-colors"
          >
            <div className="text-2xl font-semibold text-ink">{c.value}</div>
            <div className="text-xs text-muted">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-ink">Últimos bloques</h2>
        <Link href="/admin/tablero/feed" className="text-sm text-electric hover:underline">
          Ver todos →
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 p-8 text-sm text-muted">
          Aún no hay bloques. Crea uno en la pestaña “Crear”.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {recent.map((e) => (
            <BlockGroupCard
              key={`${e.note.id}-${e.key}`}
              note={e.note}
              blocks={e.blocks}
              author={authors.get(e.authorId)}
              date={e.date}
              signedUrls={signed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
