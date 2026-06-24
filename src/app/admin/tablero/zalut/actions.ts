"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/auth/dal";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import {
  INFO_CATEGORIES,
  type InfoCategory,
  type InfoEdit,
  type InfoField,
} from "./types";

export type ActionState = { error?: string; ok?: string } | undefined;

const MAX_TITLE = 200;
const MAX_VALUE = 2_000;
const MAX_NOTES = 10_000;
const MAX_FIELDS = 40;

function isCategory(v: unknown): v is InfoCategory {
  return typeof v === "string" && (INFO_CATEGORIES as string[]).includes(v);
}

type ParsedEntry = {
  category: InfoCategory;
  title: string;
  subtitle: string | null;
  fields: InfoField[];
  notes: string | null;
};

function parseEntry(formData: FormData): { ok: true; value: ParsedEntry } | { ok: false; error: string } {
  const category = formData.get("category");
  if (!isCategory(category)) return { ok: false, error: "Categoría inválida." };

  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_TITLE);
  if (!title) return { ok: false, error: "El título es obligatorio." };

  const subtitle = String(formData.get("subtitle") ?? "").trim().slice(0, MAX_TITLE) || null;
  const notes = String(formData.get("notes") ?? "").trim().slice(0, MAX_NOTES) || null;

  const rawFields = formData.get("fields");
  const fields: InfoField[] = [];
  if (typeof rawFields === "string" && rawFields) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawFields);
    } catch {
      return { ok: false, error: "Formato de campos inválido." };
    }
    if (!Array.isArray(parsed)) return { ok: false, error: "Formato de campos inválido." };
    if (parsed.length > MAX_FIELDS) return { ok: false, error: `Máximo ${MAX_FIELDS} campos.` };
    for (const f of parsed as InfoField[]) {
      if (!f || typeof f !== "object") continue;
      const label = String(f.label ?? "").trim().slice(0, MAX_TITLE);
      const value = String(f.value ?? "").trim().slice(0, MAX_VALUE);
      if (!label && !value) continue;
      fields.push({
        id: typeof f.id === "string" && f.id ? f.id : randomUUID(),
        label: label || "—",
        value,
        secret: !!f.secret,
      });
    }
  }

  return { ok: true, value: { category, title, subtitle, fields, notes } };
}

export async function createInfoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("admin");
  const p = parseEntry(formData);
  if (!p.ok) return { error: p.error };

  const supabase = createSupabaseServiceRole();
  const { error } = await supabase.from("zalut_company_info").insert({
    author_id: user.id,
    category: p.value.category,
    title: p.value.title,
    subtitle: p.value.subtitle,
    fields: p.value.fields,
    notes: p.value.notes,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/tablero/ajustes/zalut");
  return { ok: "Guardado." };
}

export async function updateInfoAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta id." };

  const p = parseEntry(formData);
  if (!p.ok) return { error: p.error };

  const supabase = createSupabaseServiceRole();
  const { data: prev } = await supabase
    .from("zalut_company_info")
    .select("edits")
    .eq("id", id)
    .maybeSingle();
  if (!prev) return { error: "Entrada no encontrada." };

  const edits: InfoEdit[] = Array.isArray(prev.edits) ? (prev.edits as InfoEdit[]) : [];
  edits.push({ user_id: user.id, at: new Date().toISOString() });

  const { error } = await supabase
    .from("zalut_company_info")
    .update({
      category: p.value.category,
      title: p.value.title,
      subtitle: p.value.subtitle,
      fields: p.value.fields,
      notes: p.value.notes,
      edits,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/tablero/ajustes/zalut");
  return { ok: "Cambios guardados." };
}

export async function deleteInfoAction(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createSupabaseServiceRole();
  await supabase.from("zalut_company_info").delete().eq("id", id);
  revalidatePath("/admin/tablero/ajustes/zalut");
}
