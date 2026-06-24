import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { loadAuthors } from "../../lib";
import { ZalutBoard } from "../../zalut/board";
import type { CompanyInfo } from "../../zalut/types";

export const dynamic = "force-dynamic";

export default async function ZalutInfoPage() {
  const supabase = createSupabaseServiceRole();
  const { data } = await supabase
    .from("zalut_company_info")
    .select("id, category, title, subtitle, fields, notes, sort, author_id, edits, created_at, updated_at")
    .order("category", { ascending: true })
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });

  const entries: CompanyInfo[] = (data ?? []) as CompanyInfo[];
  const authorsMap = await loadAuthors([
    ...entries.map((e) => e.author_id),
    ...entries.flatMap((e) => (e.edits ?? []).map((x) => x.user_id)),
  ]);
  const authors = Object.fromEntries(
    [...authorsMap.values()].map((a) => [a.id, { email: a.email, color: a.color }]),
  );

  return <ZalutBoard entries={entries} authors={authors} />;
}
