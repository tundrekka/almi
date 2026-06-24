import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { loadAuthors } from "./lib";
import { PagesNav, type PageListItem, type PersonaItem } from "./paginas/pages-nav";
import { DevTabs } from "./tabs";

export const dynamic = "force-dynamic";

export default async function TableroLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServiceRole();
  const { data } = await supabase
    .from("zalut_dev_notes")
    .select("id, icon, title, author_id, updated_at, system_key")
    .order("updated_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as {
    id: string;
    icon: string | null;
    title: string | null;
    author_id: string;
    updated_at: string;
    system_key: string | null;
  }[];

  const authors = await loadAuthors(rows.map((r) => r.author_id));

  // La página "General" siempre primero en el sidebar.
  const sorted = [...rows].sort((a, b) => {
    if (a.system_key === "general") return -1;
    if (b.system_key === "general") return 1;
    return 0;
  });
  const pages: PageListItem[] = sorted.map((r) => ({
    id: r.id,
    icon: r.icon ?? "📄",
    title: r.title ?? "Sin título",
  }));

  const count = new Map<string, number>();
  for (const r of rows) count.set(r.author_id, (count.get(r.author_id) ?? 0) + 1);
  const personas: PersonaItem[] = [...count.entries()]
    .map(([id, n]) => {
      const a = authors.get(id);
      return { id, email: a?.email ?? null, color: a?.color ?? "#9CA3AF", count: n };
    })
    .sort((a, b) => b.count - a.count || (a.email ?? "").localeCompare(b.email ?? ""));

  return (
    <div className="flex flex-col md:flex-row md:items-start">
      <PagesNav pages={pages} personas={personas} />

      <div className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
          <div>
            
          </div>

          <DevTabs />

          {children}
        </div>
      </div>
    </div>
  );
}
