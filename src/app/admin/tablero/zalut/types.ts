// Registro de información permanente de Zalut (correos, dominios, cuentas, datos).
// Vive en la tabla zalut_company_info — todo pasa por el service role (admin only).

export type InfoField = {
  id: string;
  label: string;
  value: string;
  secret?: boolean; // si true, el valor se enmascara en la UI hasta revelarlo
};

export type InfoCategory = "email" | "general";

export const INFO_CATEGORIES: InfoCategory[] = ["email", "general"];

export const CATEGORY_LABEL: Record<InfoCategory, string> = {
  email: "Correos",
  general: "Datos generales",
};

// Singular, para el botón "Nuevo …" y los títulos de tarjeta.
export const CATEGORY_SINGULAR: Record<InfoCategory, string> = {
  email: "Correo",
  general: "Dato",
};

export const CATEGORY_HINT: Record<InfoCategory, string> = {
  email: "Cuentas de correo y la info asociada (recuperación, para qué se usa, quién la creó).",
  general: "Cualquier otra info de la empresa que en teoría no cambia.",
};

export type InfoEdit = { user_id: string; at: string };

export type CompanyInfo = {
  id: string;
  category: InfoCategory;
  title: string;
  subtitle: string | null;
  fields: InfoField[];
  notes: string | null;
  sort: number;
  author_id: string;
  edits: InfoEdit[];
  created_at: string;
  updated_at: string;
};
