import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createSupabaseServer();

  if (tokenHash && type) {
    // Formato token_hash: funciona aunque el link se abra en otro navegador/dispositivo.
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      console.error("auth/callback verifyOtp:", error.message);
      return NextResponse.redirect(new URL("/auth/forgot?error=link", origin));
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  if (code) {
    // Formato PKCE: requiere la cookie code_verifier del navegador que pidió el reset.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth/callback exchangeCodeForSession:", error.message);
      return NextResponse.redirect(new URL("/auth/forgot?error=link", origin));
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/auth/forgot?error=link", origin));
}
