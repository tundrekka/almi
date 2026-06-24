import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { loadAuthors } from "../lib";
import { TodosBoard } from "./todos-board";
import type { DevBlock, DevNote } from "../types";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; author?: string; tag?: string; untagged?: string };

export default async function DevTodosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const author = (sp.author ?? "").trim();
  const tagsParam = (sp.tag ?? "").trim();
  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const untagged = (sp.untagged ?? "") === "1";

  const supabase = createSupabaseServiceRole();
  let query = supabase
    .from("zalut_dev_notes")
    .select("id, author_id, title, blocks, tags, search_text, created_at, updated_at")
    .contains("blocks", JSON.stringify([{ kind: "todo" }]))
    .order("created_at", { ascending: false })
    .limit(500);
  if (untagged) query = query.or("tags.is.null,tags.eq.{}");
  else if (tags.length > 0) query = query.contains("tags", tags);

  const { data } = await query;

  const notes: DevNote[] = (data ?? []) as DevNote[];
  const authors = await loadAuthors(notes.map((n) => n.author_id));

  // Lista global de tags presentes en notas con todos.
  const { data: allTagRows } = await supabase
    .from("zalut_dev_notes")
    .select("tags")
    .contains("blocks", JSON.stringify([{ kind: "todo" }]))
    .limit(1000);
  const tagCount = new Map<string, number>();
  for (const row of allTagRows ?? [])
    for (const t of (row.tags ?? []) as string[])
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const allTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t, n]) => ({ tag: t, count: n }));

  type Row = {
    noteId: string;
    noteTitle: string | null;
    noteDate: string;
    blockId: string;
    authorId: string;
    item: { id: string; text: string; done: boolean };
  };
  const rows: Row[] = [];
  for (const n of notes) {
    if (author && n.author_id !== author) continue;
    for (const b of n.blocks as DevBlock[]) {
      if (b.kind !== "todo") continue;
      for (const it of b.items) {
        if (q && !it.text.toLowerCase().includes(q.toLowerCase())) continue;
        rows.push({
          noteId: n.id,
          noteTitle: n.title,
          noteDate: n.created_at,
          blockId: b.id,
          authorId: n.author_id,
          item: it,
        });
      }
    }
  }

  const authorOptions = [...authors.values()].sort((a, b) =>
    (a.email ?? "").localeCompare(b.email ?? ""),
  );

  return (
    <TodosBoard
      rows={rows}
      authors={Object.fromEntries(
        [...authors.entries()].map(([id, a]) => [id, { email: a.email, color: a.color }]),
      )}
      q={q}
      author={author}
      tags={tags}
      untagged={untagged}
      authorOptions={authorOptions.map((a) => ({ id: a.id, email: a.email, color: a.color }))}
      tagOptions={allTags}
    />
  );
}
