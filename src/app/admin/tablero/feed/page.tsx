import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { BlockGroupCard } from "../block-group-card";
import { loadAuthors, signMediaForNotes } from "../lib";
import {
  groupAt,
  groupAuthorId,
  groupBlocks,
  groupTags,
  type DevBlock,
  type DevNote,
} from "../types";
import { FeedFilters } from "./filters";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  kind?: string;
  tag?: string;
  author?: string;
  untagged?: string;
};

export default async function DevFeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const kind = (sp.kind ?? "").trim();
  const tagsParam = (sp.tag ?? "").trim();
  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const author = (sp.author ?? "").trim();
  const untagged = (sp.untagged ?? "") === "1";

  const supabase = createSupabaseServiceRole();
  let query = supabase
    .from("zalut_dev_notes")
    .select("id, author_id, title, icon, blocks, tags, search_text, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) query = query.ilike("search_text", `%${q.toLowerCase()}%`);
  // El filtro fino de tags es por bloque (abajo). A nivel de página solo
  // optimizamos: note.tags es la unión de los tags de sus bloques.
  if (!untagged && tags.length > 0) query = query.contains("tags", tags);
  if (kind) query = query.contains("blocks", JSON.stringify([{ kind }]));
  if (author) query = query.eq("author_id", author);

  const { data, error } = await query;
  const notes: DevNote[] = (data ?? []) as DevNote[];

  // Lista global de tags y autores (sin aplicar filtros) para los dropdowns.
  const { data: allMetaRows } = await supabase
    .from("zalut_dev_notes")
    .select("tags, author_id")
    .limit(2000);
  const tagCount = new Map<string, number>();
  const authorCount = new Map<string, number>();
  for (const row of allMetaRows ?? []) {
    for (const t of (row.tags ?? []) as string[])
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    const aid = row.author_id as string | null;
    if (aid) authorCount.set(aid, (authorCount.get(aid) ?? 0) + 1);
  }
  const allTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t, n]) => ({ tag: t, count: n }));

  const allAuthorIds = [...authorCount.keys()];

  // Expande cada página en sus bloques (grupos): en el feed cada bloque es una
  // tarjeta distinta, con el autor y la fecha del propio bloque. Si hay filtro
  // por tipo, solo se muestran los componentes de ese tipo.
  const expanded: {
    note: DevNote;
    key: string;
    blocks: DevBlock[];
    authorId: string;
    date: string;
  }[] = [];
  for (const n of notes) {
    for (const g of groupBlocks((n.blocks ?? []) as DevBlock[])) {
      const visible = kind ? g.blocks.filter((b) => b.kind === kind) : g.blocks;
      if (!visible.length) continue;
      const gTags = groupTags(g);
      if (untagged && gTags.length) continue;
      if (!untagged && tags.length && !tags.every((t) => gTags.includes(t))) continue;
      expanded.push({
        note: n,
        key: g.key,
        blocks: visible,
        authorId: groupAuthorId(g, n.author_id),
        date: groupAt(g, n.created_at),
      });
    }
  }
  // Más recientes primero (por fecha del bloque).
  expanded.sort((a, b) => b.date.localeCompare(a.date));

  const authors = await loadAuthors([
    ...notes.map((n) => n.author_id),
    ...expanded.map((e) => e.authorId),
    ...allAuthorIds,
  ]);
  const signed = await signMediaForNotes(notes);

  const allAuthors = allAuthorIds
    .map((id) => {
      const a = authors.get(id);
      return {
        id,
        email: a?.email ?? null,
        color: a?.color ?? "#9CA3AF",
        count: authorCount.get(id) ?? 0,
      };
    })
    .sort(
      (a, b) =>
        b.count - a.count ||
        (a.email ?? "").localeCompare(b.email ?? ""),
    );

  return (
    <div className="flex flex-col gap-6">
      <FeedFilters
        q={q}
        kind={kind}
        tags={tags}
        author={author}
        untagged={untagged}
        allTags={allTags}
        allAuthors={allAuthors}
      />

      {error ? (
        <div className="rounded-xl bg-[#FEECEC] text-[#9F1A1A] text-sm px-3 py-2">
          {error.message}
        </div>
      ) : null}

      {expanded.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 p-8 text-sm text-muted">
          Sin resultados.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {expanded.map((e) => (
            <BlockGroupCard
              key={`${e.note.id}-${e.key}`}
              note={e.note}
              blocks={e.blocks}
              author={authors.get(e.authorId)}
              date={e.date}
              signedUrls={signed}
              q={q}
            />
          ))}
        </div>
      )}
    </div>
  );
}
