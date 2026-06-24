import Link from "next/link";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { Composer } from "../composer";
import { getGeneralPageId } from "../lib";

export const dynamic = "force-dynamic";

export default async function DevNuevoPage() {
  const supabase = createSupabaseServiceRole();
  const { data } = await supabase.from("zalut_dev_notes").select("tags").limit(1000);
  const set = new Set<string>();
  for (const row of data ?? [])
    for (const t of (row.tags ?? []) as string[]) set.add(t);
  const existingTags = [...set].sort();

  const generalId = await getGeneralPageId();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Crea un bloque (texto, links, imágenes, audio, documentos, to dos). Se añade a la página{" "}
        {generalId ? (
          <Link href={`/admin/tablero/paginas/${generalId}`} className="text-electric hover:underline">
            🗂️ General
          </Link>
        ) : (
          "General"
        )}
        . Puedes arrastrar archivos a cualquier parte para subirlos, o pegar imágenes con{" "}
        <kbd>⌘/Ctrl + V</kbd>.
      </p>
      {generalId ? (
        <Composer appendToNoteId={generalId} existingTags={existingTags} />
      ) : (
        <div className="rounded-xl bg-[#FEECEC] text-[#9F1A1A] text-sm px-3 py-2">
          No se encontró la página General.
        </div>
      )}
    </div>
  );
}
