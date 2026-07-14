"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase/server";
import { env } from "@/lib/env";

// Origen público de la app derivado del request; así el link del correo
// apunta al dominio donde el usuario está navegando (prod o local),
// sin depender de NEXT_PUBLIC_SITE_URL.
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return env.SITE_URL;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

type State = { error?: string; code?: "already_registered" | "invalid_credentials" } | undefined;

function safeNext(next: FormDataEntryValue | null): string {
  if (typeof next !== "string") return "/";
  // solo paths internos, no URLs externas
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export async function signInAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Email y contraseña son requeridos." };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid_credentials")) {
      return {
        error: "Correo o contraseña incorrectos. Si la olvidaste, restablécela abajo.",
        code: "invalid_credentials",
      };
    }
    return { error: error.message };
  }
  redirect(next);
}

export async function authAction(_prev: State, formData: FormData): Promise<State> {
  const mode = String(formData.get("mode") ?? "signin");
  if (mode === "signup") return signUpAction(_prev, formData);
  return signInAction(_prev, formData);
}

export async function signUpAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Email y contraseña son requeridos." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return {
        error:
          "Ya existe una cuenta con ese correo. Usa Ingresar — si olvidaste la contraseña, puedes restablecerla.",
        code: "already_registered",
      };
    }
    return { error: error.message };
  }

  // Si Supabase tiene "Confirm email" activo, no hay sesión todavía.
  if (!data.session) {
    return { error: "Cuenta creada. Revisa tu correo para confirmar antes de entrar." };
  }
  redirect(next);
}

type RecoveryState = { error?: string; ok?: string } | undefined;

export async function requestPasswordResetAction(
  _prev: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Ingresa tu correo." };

  const supabase = await createSupabaseServer();
  const redirectTo = `${await requestOrigin()}/auth/callback?next=/auth/reset`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message };

  // Respuesta genérica para no filtrar si el correo existe.
  return {
    ok: "Si el correo está registrado, te enviamos un enlace para restablecer la contraseña. Revisa tu bandeja (y spam).",
  };
}

export async function updatePasswordAction(
  _prev: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) return { error: "Mínimo 6 caracteres." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "El enlace expiró. Pide uno nuevo." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/");
}
