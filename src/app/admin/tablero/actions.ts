"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/auth/dal";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import {
  BLOCK_KINDS,
  DEV_MEDIA_BUCKET,
  type DevBlock,
  type TodoItem,
} from "./types";

export type ActionState = { error?: string; ok?: string } | undefined;

const MAX_TEXT = 10_000;
const MAX_BLOCKS = 30;

function id() {
  return randomUUID();
}

function extractTags(text: string): string[] {
  const tags = new Set<string>();
  const re = /#([a-z0-9_-]{2,32})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) tags.add(m[1].toLowerCase());
  return [...tags];
}

function buildSearchText(blocks: DevBlock[], title: string | null): string {
  const parts: string[] = [];
  if (title) parts.push(title);
  for (const b of blocks) {
    if (b.kind === "text") parts.push(b.text);
    else if (b.kind === "link") parts.push(b.label ?? "", b.url);
    else if (b.kind === "image" || b.kind === "audio") parts.push(b.name ?? "");
    else if (b.kind === "todo") parts.push(...b.items.map((i) => i.text));
  }
  return parts.join(" \n ").toLowerCase();
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

type ParsedPayload =
  | { ok: true; title: string | null; blocks: DevBlock[]; tags: string[]; search_text: string }
  | { ok: false; error: string };

function parsePayload(formData: FormData): ParsedPayload {
  const title = (String(formData.get("title") ?? "").trim() || null) as string | null;
  const raw = formData.get("blocks");
  if (typeof raw !== "string" || !raw) return { ok: false, error: "Agrega al menos un bloque." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Formato de bloques inválido." };
  }
  if (!Array.isArray(parsed) || parsed.length === 0)
    return { ok: false, error: "Agrega al menos un bloque." };
  if (parsed.length > MAX_BLOCKS)
    return { ok: false, error: `Máximo ${MAX_BLOCKS} bloques por nota.` };

  const blocks: DevBlock[] = [];
  for (const b of parsed as DevBlock[]) {
    if (!b || typeof b !== "object") continue;
    if (!BLOCK_KINDS.includes(b.kind)) continue;
    const meta = {
      id: typeof b.id === "string" && b.id ? b.id : id(),
      group: typeof b.group === "string" && b.group ? b.group : undefined,
      author: typeof b.author === "string" && b.author ? b.author : undefined,
      at: typeof b.at === "string" && b.at ? b.at : undefined,
      tags: Array.isArray(b.tags) ? b.tags.filter((t) => typeof t === "string") : undefined,
    };
    if (b.kind === "text") {
      const text = String(b.text ?? "").slice(0, MAX_TEXT).trim();
      if (!text) continue;
      blocks.push({ ...meta, kind: "text", text });
    } else if (b.kind === "link") {
      const url = String(b.url ?? "").trim();
      if (!isHttpUrl(url)) return { ok: false, error: `Link inválido: ${url || "(vacío)"}` };
      const label = b.label ? String(b.label).slice(0, 200).trim() : undefined;
      blocks.push({ ...meta, kind: "link", url, label, pinned: !!b.pinned });
    } else if (b.kind === "image" || b.kind === "audio") {
      const path = String(b.path ?? "").trim();
      if (!path) return { ok: false, error: `Falta archivo en bloque ${b.kind}.` };
      blocks.push({
        ...meta,
        kind: b.kind,
        path,
        name: b.name ? String(b.name).slice(0, 200) : undefined,
        mime: b.mime ? String(b.mime).slice(0, 100) : undefined,
      });
    } else if (b.kind === "file") {
      const path = String(b.path ?? "").trim();
      if (!path) return { ok: false, error: "Falta archivo en bloque documento." };
      blocks.push({
        ...meta,
        kind: "file",
        path,
        name: b.name ? String(b.name).slice(0, 200) : undefined,
        mime: b.mime ? String(b.mime).slice(0, 100) : undefined,
        size: typeof b.size === "number" ? b.size : undefined,
      });
    } else if (b.kind === "todo") {
      const items: TodoItem[] = (Array.isArray(b.items) ? b.items : [])
        .map((it) => ({
          id: typeof it?.id === "string" && it.id ? it.id : id(),
          text: String(it?.text ?? "").slice(0, 500).trim(),
          done: !!it?.done,
        }))
        .filter((it) => it.text);
      if (items.length === 0) continue;
      blocks.push({ ...meta, kind: "todo", items });
    }
  }

  if (blocks.length === 0)
    return { ok: false, error: "Agrega al menos un bloque con contenido." };

  const search_text = buildSearchText(blocks, title);
  const auto = extractTags(search_text);

  const manualRaw = formData.get("tags");
  const manual: string[] = [];
  if (typeof manualRaw === "string" && manualRaw) {
    try {
      const parsedTags = JSON.parse(manualRaw);
      if (Array.isArray(parsedTags)) {
        for (const t of parsedTags) {
          if (typeof t !== "string") continue;
          const norm = t
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 32);
          if (norm) manual.push(norm);
        }
      }
    } catch {
      // ignora malformado
    }
  }

  const tags = [...new Set([...manual, ...auto])];
  return { ok: true, title, blocks, tags, search_text };
}

export async function createNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = createSupabaseServiceRole();

  const p = parsePayload(formData);
  if (!p.ok) return { error: p.error };

  // Lo creado de una vez es un solo bloque (grupo) con autor, fecha y tags.
  const groupId = randomUUID();
  const at = new Date().toISOString();
  const blocks = p.blocks.map((b) => ({
    ...b,
    group: b.group ?? groupId,
    author: b.author ?? user.id,
    at: b.at ?? at,
    tags: b.tags ?? p.tags,
  }));

  const { error } = await supabase.from("zalut_dev_notes").insert({
    author_id: user.id,
    title: p.title,
    blocks,
    tags: p.tags,
    search_text: p.search_text,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/tablero");
  return { ok: "Nota guardada." };
}

export async function updateNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = createSupabaseServiceRole();

  const noteId = String(formData.get("id") ?? "");
  if (!noteId) return { error: "Falta id de nota." };

  const p = parsePayload(formData);
  if (!p.ok) return { error: p.error };

  // Detectar archivos huérfanos: imágenes/audio/files que estaban antes pero ya no.
  const { data: prev } = await supabase
    .from("zalut_dev_notes")
    .select("blocks, edits")
    .eq("id", noteId)
    .maybeSingle();
  if (!prev) return { error: "Nota no encontrada." };

  const oldPaths = new Set<string>();
  for (const b of (prev.blocks ?? []) as DevBlock[]) {
    if (b.kind === "image" || b.kind === "audio" || b.kind === "file") oldPaths.add(b.path);
  }
  const newPaths = new Set<string>();
  for (const b of p.blocks) {
    if (b.kind === "image" || b.kind === "audio" || b.kind === "file") newPaths.add(b.path);
  }
  const orphans = [...oldPaths].filter((x) => !newPaths.has(x));
  if (orphans.length) {
    await supabase.storage.from(DEV_MEDIA_BUCKET).remove(orphans);
  }

  const edits = Array.isArray(prev.edits) ? (prev.edits as { user_id: string; at: string }[]) : [];
  edits.push({ user_id: user.id, at: new Date().toISOString() });

  // tags de la página = unión de los tags de sus bloques.
  const noteTags = [...new Set(p.blocks.flatMap((b) => b.tags ?? []))];

  const { error } = await supabase
    .from("zalut_dev_notes")
    .update({
      title: p.title,
      blocks: p.blocks,
      tags: noteTags,
      search_text: p.search_text,
      edits,
    })
    .eq("id", noteId);
  if (error) return { error: error.message };

  revalidatePath("/admin/tablero");
  revalidatePath(`/admin/nota/${noteId}`);
  return { ok: "Cambios guardados." };
}

export async function deleteNoteAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const supabase = createSupabaseServiceRole();
  const noteId = String(formData.get("id") ?? "");
  if (!noteId) return;

  // Borra archivos asociados.
  const { data: note } = await supabase
    .from("zalut_dev_notes")
    .select("blocks")
    .eq("id", noteId)
    .maybeSingle();

  const paths: string[] = [];
  for (const b of (note?.blocks ?? []) as DevBlock[]) {
    if (b.kind === "image" || b.kind === "audio" || b.kind === "file") paths.push(b.path);
  }
  if (paths.length) {
    await supabase.storage.from(DEV_MEDIA_BUCKET).remove(paths);
  }

  await supabase.from("zalut_dev_notes").delete().eq("id", noteId);
  revalidatePath("/admin/tablero");
}

export async function toggleTodoAction(
  noteId: string,
  blockId: string,
  itemId: string,
  done: boolean,
): Promise<void> {
  await requireRole("admin");
  const supabase = createSupabaseServiceRole();
  if (!noteId || !blockId || !itemId) return;

  const { data: note } = await supabase
    .from("zalut_dev_notes")
    .select("blocks, title")
    .eq("id", noteId)
    .maybeSingle();
  if (!note) return;

  const blocks = (note.blocks ?? []) as DevBlock[];
  let changed = false;
  for (const b of blocks) {
    if (b.kind !== "todo" || b.id !== blockId) continue;
    for (const it of b.items) {
      if (it.id === itemId) {
        it.done = done;
        changed = true;
      }
    }
  }
  if (!changed) return;

  await supabase
    .from("zalut_dev_notes")
    .update({
      blocks,
      search_text: buildSearchText(blocks, note.title ?? null),
    })
    .eq("id", noteId);
  // No revalidatePath: el cliente actualiza optimistamente.
}

export async function toggleLinkPinAction(
  noteId: string,
  blockId: string,
): Promise<void> {
  await requireRole("admin");
  if (!noteId || !blockId) return;

  const supabase = createSupabaseServiceRole();
  const { data: note } = await supabase
    .from("zalut_dev_notes")
    .select("blocks")
    .eq("id", noteId)
    .maybeSingle();
  if (!note) return;

  const blocks = (note.blocks ?? []) as DevBlock[];
  let changed = false;
  for (const b of blocks) {
    if (b.kind === "link" && b.id === blockId) {
      b.pinned = !b.pinned;
      changed = true;
    }
  }
  if (!changed) return;

  await supabase.from("zalut_dev_notes").update({ blocks }).eq("id", noteId);
  revalidatePath("/admin/tablero");
  revalidatePath("/admin/tablero/feed");
  revalidatePath(`/admin/nota/${noteId}`);
}

export async function uploadMediaAction(
  formData: FormData,
): Promise<
  | { ok: true; path: string; name: string; mime: string; size: number }
  | { ok: false; error: string }
> {
  await requireRole("admin");
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Archivo inválido." };
  if (file.size === 0) return { ok: false, error: "Archivo vacío." };
  if (file.size > 100 * 1024 * 1024) return { ok: false, error: "Máximo 100 MB." };

  const supabase = createSupabaseServiceRole();
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${new Date().getFullYear()}/${id()}.${ext}`;

  const { error } = await supabase.storage
    .from(DEV_MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    path,
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
  };
}

export async function setDevColorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("admin");
  const color = String(formData.get("color") ?? "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: "Color inválido (#RRGGBB)." };

  const supabase = createSupabaseServiceRole();
  const { error } = await supabase
    .from("zalut_profiles")
    .update({ dev_color: color })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/admin/tablero");
  revalidatePath("/admin/tablero/feed");
  revalidatePath("/admin/tablero/todos");
  return { ok: "Color guardado." };
}

export async function signMediaUrlsAction(
  paths: string[],
): Promise<Record<string, string>> {
  await requireRole("admin");
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

// ===========================================================================
// Páginas (vista tipo Notion) — una "página" es una nota multi-bloque.
// ===========================================================================

// Crea una página vacía y redirige a ella.
export async function createPageAction(formData: FormData): Promise<void> {
  const user = await requireRole("admin");
  const supabase = createSupabaseServiceRole();

  const title = String(formData.get("title") ?? "").trim().slice(0, 200) || "Sin título";
  const icon = String(formData.get("icon") ?? "").trim().slice(0, 8) || "📄";

  const { data, error } = await supabase
    .from("zalut_dev_notes")
    .insert({
      author_id: user.id,
      title,
      icon,
      blocks: [],
      tags: [],
      search_text: title.toLowerCase(),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo crear la página.");

  revalidatePath("/admin/tablero/paginas");
  redirect(`/admin/tablero/paginas/${data.id}`);
}

// Cambia título y/o emoji de una página (autosave inline).
export async function renamePageAction(
  noteId: string,
  patch: { title?: string; icon?: string },
): Promise<void> {
  await requireRole("admin");
  if (!noteId) return;
  const supabase = createSupabaseServiceRole();

  const update: Record<string, string> = {};
  if (typeof patch.title === "string") update.title = patch.title.trim().slice(0, 200) || "Sin título";
  if (typeof patch.icon === "string") update.icon = patch.icon.trim().slice(0, 8) || "📄";
  if (Object.keys(update).length === 0) return;

  await supabase.from("zalut_dev_notes").update(update).eq("id", noteId);
  revalidatePath("/admin/tablero/paginas");
  revalidatePath(`/admin/tablero/paginas/${noteId}`);
}

// Sanitiza un único bloque entrante del cliente.
function sanitizeBlock(b: DevBlock): DevBlock | null {
  if (!b || typeof b !== "object" || !BLOCK_KINDS.includes(b.kind)) return null;
  const blockId = typeof b.id === "string" && b.id ? b.id : randomUUID();
  if (b.kind === "text") {
    const text = String(b.text ?? "").slice(0, MAX_TEXT).trim();
    return text ? { id: blockId, kind: "text", text } : null;
  }
  if (b.kind === "link") {
    const url = String(b.url ?? "").trim();
    if (!isHttpUrl(url)) return null;
    const label = b.label ? String(b.label).slice(0, 200).trim() : undefined;
    return { id: blockId, kind: "link", url, label, pinned: !!b.pinned };
  }
  if (b.kind === "image" || b.kind === "audio") {
    const path = String(b.path ?? "").trim();
    if (!path) return null;
    return {
      id: blockId,
      kind: b.kind,
      path,
      name: b.name ? String(b.name).slice(0, 200) : undefined,
      mime: b.mime ? String(b.mime).slice(0, 100) : undefined,
    };
  }
  if (b.kind === "file") {
    const path = String(b.path ?? "").trim();
    if (!path) return null;
    return {
      id: blockId,
      kind: "file",
      path,
      name: b.name ? String(b.name).slice(0, 200) : undefined,
      mime: b.mime ? String(b.mime).slice(0, 100) : undefined,
      size: typeof b.size === "number" ? b.size : undefined,
    };
  }
  if (b.kind === "todo") {
    const items: TodoItem[] = (Array.isArray(b.items) ? b.items : [])
      .map((it) => ({
        id: typeof it?.id === "string" && it.id ? it.id : randomUUID(),
        text: String(it?.text ?? "").slice(0, 500).trim(),
        done: !!it?.done,
      }))
      .filter((it) => it.text);
    return items.length ? { id: blockId, kind: "todo", items } : null;
  }
  return null;
}

function normTag(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

// Añade uno o varios bloques al final de una página (composer multibloque).
export async function appendBlocksAction(
  noteId: string,
  incoming: DevBlock[],
  manualTags: string[] = [],
): Promise<ActionState> {
  const user = await requireRole("admin");
  if (!noteId) return { error: "Falta id de página." };

  const clean = (Array.isArray(incoming) ? incoming : [])
    .map((b) => sanitizeBlock(b))
    .filter((b): b is DevBlock => b !== null);
  if (clean.length === 0) return { error: "Agrega al menos un bloque con contenido." };

  // Tags del BLOQUE (no de la página): manuales + #hashtags de SU propio texto.
  const groupAuto = extractTags(buildSearchText(clean, null));
  const manual = (Array.isArray(manualTags) ? manualTags : []).map(normTag).filter(Boolean);
  const blockTags = [...new Set([...manual, ...groupAuto])];

  // Todo lo agregado en esta acción es UN bloque (grupo): comparten group/autor/fecha/tags.
  const groupId = randomUUID();
  const at = new Date().toISOString();
  for (const b of clean) {
    b.group = groupId;
    b.author = user.id;
    b.at = at;
    b.tags = blockTags;
  }

  const supabase = createSupabaseServiceRole();
  const { data: prev } = await supabase
    .from("zalut_dev_notes")
    .select("blocks, title, tags, edits")
    .eq("id", noteId)
    .maybeSingle();
  if (!prev) return { error: "Página no encontrada." };

  const blocks = [...((prev.blocks ?? []) as DevBlock[]), ...clean];
  const search_text = buildSearchText(blocks, (prev.title as string | null) ?? null);
  // tags de la página = unión de los tags de sus bloques (para filtro/sidebar).
  const tags = [...new Set(blocks.flatMap((b) => b.tags ?? []))] as string[];
  const edits = Array.isArray(prev.edits) ? (prev.edits as { user_id: string; at: string }[]) : [];
  edits.push({ user_id: user.id, at: new Date().toISOString() });

  const { error } = await supabase
    .from("zalut_dev_notes")
    .update({ blocks, search_text, tags, edits })
    .eq("id", noteId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/tablero/paginas/${noteId}`);
  revalidatePath("/admin/tablero/paginas");
  return { ok: `${clean.length === 1 ? "Bloque añadido" : `${clean.length} bloques añadidos`}.` };
}

// Edita un bloque (grupo) en su sitio: reemplaza los componentes de ese grupo.
// Conserva su posición, autor y fecha originales.
export async function updateBlockGroupAction(
  noteId: string,
  groupKey: string,
  incoming: DevBlock[],
  manualTags: string[] = [],
): Promise<ActionState> {
  const user = await requireRole("admin");
  if (!noteId || !groupKey) return { error: "Falta id." };

  const clean = (Array.isArray(incoming) ? incoming : [])
    .map((b) => sanitizeBlock(b))
    .filter((b): b is DevBlock => b !== null);
  if (clean.length === 0) return { error: "Agrega al menos un bloque con contenido." };

  const supabase = createSupabaseServiceRole();
  const { data: prev } = await supabase
    .from("zalut_dev_notes")
    .select("blocks, title, edits")
    .eq("id", noteId)
    .maybeSingle();
  if (!prev) return { error: "Página no encontrada." };

  const all = (prev.blocks ?? []) as DevBlock[];
  const oldGroup = all.filter((b) => (b.group ?? b.id) === groupKey);
  if (oldGroup.length === 0) return { error: "Bloque no encontrado." };

  // Conserva grupo/autor/fecha originales; tags = manual + #hashtags del propio texto.
  const origAuthor = oldGroup[0].author;
  const origAt = oldGroup[0].at;
  const groupAuto = extractTags(buildSearchText(clean, null));
  const manual = (Array.isArray(manualTags) ? manualTags : []).map(normTag).filter(Boolean);
  const blockTags = [...new Set([...manual, ...groupAuto])];
  for (const b of clean) {
    b.group = groupKey;
    b.author = origAuthor;
    b.at = origAt;
    b.tags = blockTags;
  }

  // Reemplaza en su posición original.
  const blocks: DevBlock[] = [];
  let inserted = false;
  for (const b of all) {
    if ((b.group ?? b.id) === groupKey) {
      if (!inserted) {
        blocks.push(...clean);
        inserted = true;
      }
    } else {
      blocks.push(b);
    }
  }

  // Borra media huérfana del grupo viejo.
  const newPaths = new Set(
    clean.filter((b) => b.kind === "image" || b.kind === "audio" || b.kind === "file").map((b) => b.path),
  );
  const orphans = oldGroup
    .filter((b) => b.kind === "image" || b.kind === "audio" || b.kind === "file")
    .map((b) => b.path)
    .filter((p) => !newPaths.has(p));
  if (orphans.length) await supabase.storage.from(DEV_MEDIA_BUCKET).remove(orphans);

  const search_text = buildSearchText(blocks, (prev.title as string | null) ?? null);
  const tags = [...new Set(blocks.flatMap((b) => b.tags ?? []))] as string[];
  const edits = Array.isArray(prev.edits) ? (prev.edits as { user_id: string; at: string }[]) : [];
  edits.push({ user_id: user.id, at: new Date().toISOString() });

  const { error } = await supabase
    .from("zalut_dev_notes")
    .update({ blocks, search_text, tags, edits })
    .eq("id", noteId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/tablero/paginas/${noteId}`);
  return { ok: "Bloque actualizado." };
}

// Borra un bloque completo (grupo) de una página. `key` es el group del lote,
// o el id de un bloque suelto sin group.
export async function deleteBlockAction(
  noteId: string,
  key: string,
): Promise<void> {
  await requireRole("admin");
  if (!noteId || !key) return;
  const supabase = createSupabaseServiceRole();

  const { data: prev } = await supabase
    .from("zalut_dev_notes")
    .select("blocks, title")
    .eq("id", noteId)
    .maybeSingle();
  if (!prev) return;

  const all = (prev.blocks ?? []) as DevBlock[];
  const matches = (b: DevBlock) => (b.group ?? b.id) === key;
  const remaining = all.filter((b) => !matches(b));
  if (remaining.length === all.length) return; // nada que borrar

  const paths: string[] = [];
  for (const b of all.filter(matches)) {
    if (b.kind === "image" || b.kind === "audio" || b.kind === "file") paths.push(b.path);
  }
  if (paths.length) await supabase.storage.from(DEV_MEDIA_BUCKET).remove(paths);

  await supabase
    .from("zalut_dev_notes")
    .update({
      blocks: remaining,
      search_text: buildSearchText(remaining, (prev.title as string | null) ?? null),
    })
    .eq("id", noteId);
  revalidatePath(`/admin/tablero/paginas/${noteId}`);
}
