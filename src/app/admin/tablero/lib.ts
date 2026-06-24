import "server-only";

import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { DEV_MEDIA_BUCKET, type DevBlock, type DevNote } from "./types";

const PALETTE = [
  "#E11D48", // rose
  "#2563EB", // blue
  "#16A34A", // green
  "#D97706", // amber
  "#7C3AED", // violet
  "#0891B2", // cyan
  "#DB2777", // pink
  "#65A30D", // lime
  "#EA580C", // orange
  "#0D9488", // teal
];

export function fallbackColor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// Id de la página "General" (system_key='general'), destino por defecto al crear bloques.
export async function getGeneralPageId(): Promise<string | null> {
  const supabase = createSupabaseServiceRole();
  const { data } = await supabase
    .from("zalut_dev_notes")
    .select("id")
    .eq("system_key", "general")
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export type AuthorInfo = { id: string; email: string | null; color: string };

export async function loadAuthors(authorIds: string[]): Promise<Map<string, AuthorInfo>> {
  const map = new Map<string, AuthorInfo>();
  if (authorIds.length === 0) return map;
  const supabase = createSupabaseServiceRole();
  const unique = [...new Set(authorIds)];

  const { data: profiles } = await supabase
    .from("zalut_profiles")
    .select("id, dev_color")
    .in("id", unique);
  const colorById = new Map((profiles ?? []).map((p) => [p.id as string, p.dev_color as string | null]));

  // Emails — un solo listUsers en vez de N getUserById.
  const emailById = new Map<string, string | null>();
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
  for (const u of list?.users ?? []) emailById.set(u.id, u.email ?? null);

  for (const id of unique) {
    map.set(id, {
      id,
      email: emailById.get(id) ?? null,
      color: colorById.get(id) ?? fallbackColor(id),
    });
  }
  return map;
}

export async function signMediaForNotes(
  notes: DevNote[],
): Promise<Record<string, string>> {
  const paths: string[] = [];
  for (const n of notes) {
    for (const b of n.blocks as DevBlock[]) {
      if (b.kind === "image" || b.kind === "audio" || b.kind === "file") paths.push(b.path);
    }
  }
  if (paths.length === 0) return {};
  const supabase = createSupabaseServiceRole();
  const { data } = await supabase.storage
    .from(DEV_MEDIA_BUCKET)
    .createSignedUrls(paths, 60 * 60);
  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) out[row.path] = row.signedUrl;
  }
  return out;
}

export type NoteSummary = {
  text: number;
  link: number;
  image: number;
  audio: number;
  file: number;
  todo: number;
  todoOpen: number;
  todoDone: number;
};

export function summarize(notes: DevNote[]): NoteSummary {
  const s: NoteSummary = {
    text: 0,
    link: 0,
    image: 0,
    audio: 0,
    file: 0,
    todo: 0,
    todoOpen: 0,
    todoDone: 0,
  };
  for (const n of notes) {
    for (const b of n.blocks as DevBlock[]) {
      if (b.kind === "text") s.text++;
      else if (b.kind === "link") s.link++;
      else if (b.kind === "image") s.image++;
      else if (b.kind === "audio") s.audio++;
      else if (b.kind === "file") s.file++;
      else if (b.kind === "todo") {
        s.todo++;
        for (const it of b.items) {
          if (it.done) s.todoDone++;
          else s.todoOpen++;
        }
      }
    }
  }
  return s;
}
