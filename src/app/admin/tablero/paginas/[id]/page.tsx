import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { BlockView } from "../../block-view";
import { fallbackColor, loadAuthors, signMediaForNotes } from "../../lib";
import {
  groupAt,
  groupAuthorId,
  groupBlocks,
  groupTags,
  type DevBlock,
  type DevNote,
} from "../../types";
import { AddBlockSection } from "../add-block-section";
import { CollapseAllToggle, CollapseProvider, type PageOption } from "../blocks-collapse";
import { EditableBlock } from "../editable-block";
import { PageFilterBar } from "../page-filter-bar";
import { PageTitle } from "../page-title";

export const dynamic = "force-dynamic";

function fmtDate(s: string): string {
  return new Date(s).toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function blockText(b: DevBlock): string {
  if (b.kind === "text") return b.text;
  if (b.kind === "link") return `${b.label ?? ""} ${b.url}`;
  if (b.kind === "image" || b.kind === "audio" || b.kind === "file") return b.name ?? "";
  if (b.kind === "todo") return b.items.map((i) => i.text).join(" ");
  return "";
}

type SearchParams = { q?: string; kind?: string; tag?: string; author?: string; untagged?: string };

export default async function PaginaView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const ql = q.toLowerCase();
  const kind = (sp.kind ?? "").trim();
  const tags = (sp.tag ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const author = (sp.author ?? "").trim();
  const untagged = (sp.untagged ?? "") === "1";

  const supabase = createSupabaseServiceRole();
  const { data } = await supabase
    .from("zalut_dev_notes")
    .select("id, author_id, title, icon, blocks, tags, search_text, edits, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const note = data as DevNote;
  const blocks = (note.blocks ?? []) as DevBlock[];
  const groups = groupBlocks(blocks);

  const authors = await loadAuthors([
    note.author_id,
    ...groups.map((g) => groupAuthorId(g, note.author_id)),
  ]);
  const signed = await signMediaForNotes([note]);

  // Tags globales (autocompletar) + lista de páginas (reasignar bloque).
  const { data: noteRows } = await supabase
    .from("zalut_dev_notes")
    .select("id, icon, title, tags, system_key, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1000);
  const tagSet = new Set<string>();
  for (const r of noteRows ?? []) for (const t of (r.tags ?? []) as string[]) tagSet.add(t);
  const existingTags = [...tagSet].sort();

  // Páginas para el selector de reasignación; "General" siempre primero.
  const pages: PageOption[] = [...(noteRows ?? [])]
    .sort((a, b) => {
      if (a.system_key === "general") return -1;
      if (b.system_key === "general") return 1;
      return 0;
    })
    .map((r) => ({
      id: r.id as string,
      icon: (r.icon as string | null) ?? "📄",
      title: (r.title as string | null) ?? "Sin título",
    }));

  // Opciones de filtro: tags y autores presentes EN ESTA página.
  const tagCount = new Map<string, number>();
  const authorCount = new Map<string, number>();
  for (const g of groups) {
    for (const t of groupTags(g)) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    const aid = groupAuthorId(g, note.author_id);
    authorCount.set(aid, (authorCount.get(aid) ?? 0) + 1);
  }
  const allTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t, n]) => ({ tag: t, count: n }));
  const allAuthors = [...authorCount.entries()]
    .map(([aid, count]) => {
      const a = authors.get(aid);
      return { id: aid, email: a?.email ?? null, color: a?.color ?? fallbackColor(aid), count };
    })
    .sort((a, b) => b.count - a.count || (a.email ?? "").localeCompare(b.email ?? ""));

  // Aplica filtros a los bloques de la página.
  const filtered = groups
    .map((g) => ({ g, visible: kind ? g.blocks.filter((b) => b.kind === kind) : g.blocks }))
    .filter(({ g, visible }) => {
      if (!visible.length) return false;
      if (author && groupAuthorId(g, note.author_id) !== author) return false;
      const gTags = groupTags(g);
      if (untagged && gTags.length) return false;
      if (!untagged && tags.length && !tags.every((t) => gTags.includes(t))) return false;
      if (q && !g.blocks.map(blockText).join(" ").toLowerCase().includes(ql)) return false;
      return true;
    });

  return (
    <article className="flex flex-col gap-4 max-w-3xl">
      <PageTitle noteId={note.id} initialIcon={note.icon ?? "📄"} initialTitle={note.title ?? ""} />

      {groups.length > 0 ? (
        <PageFilterBar
          basePath={`/admin/tablero/paginas/${note.id}`}
          q={q}
          kind={kind}
          tags={tags}
          author={author}
          untagged={untagged}
          allTags={allTags}
          allAuthors={allAuthors}
        />
      ) : null}

      {/* La página es el contenedor; dentro va una lista de bloques DISTINTOS. */}
      <CollapseProvider defaultCollapsed>
        {filtered.length > 0 ? (
          <div className="flex justify-end -mb-1">
            <CollapseAllToggle />
          </div>
        ) : null}
        <div className="flex flex-col gap-3">
        {groups.length === 0 ? (
          <p className="text-sm text-muted py-4">
            Página vacía. Añade tu primer bloque abajo 👇
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted py-4">Ningún bloque coincide con los filtros.</p>
        ) : (
          filtered.map(({ g, visible }) => {
            const aid = groupAuthorId(g, note.author_id);
            const ga = authors.get(aid);
            const color = ga?.color ?? fallbackColor(aid);
            return (
              <EditableBlock
                key={g.key}
                noteId={note.id}
                groupKey={g.key}
                blocks={g.blocks}
                tags={groupTags(g)}
                existingTags={existingTags}
                pages={pages}
                color={color}
                email={ga?.email ?? "—"}
                date={fmtDate(groupAt(g, note.created_at))}
              >
                {visible.map((b) => (
                  <BlockView key={b.id} block={b} noteId={note.id} signedUrls={signed} q={q} />
                ))}
                {groupTags(g).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {groupTags(g).map((t) => (
                      <Link
                        key={t}
                        href={`/admin/tablero/paginas/${note.id}?tag=${encodeURIComponent(t)}`}
                        className="text-[11px] px-1.5 py-0.5 rounded-full bg-paper border border-line text-muted hover:text-ink"
                      >
                        #{t}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </EditableBlock>
            );
          })
        )}
        </div>
      </CollapseProvider>

      <div className="mt-2">
        <AddBlockSection noteId={note.id} existingTags={existingTags} />
      </div>
    </article>
  );
}
