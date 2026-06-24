import { requireRole } from "@/lib/auth/dal";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { fallbackColor } from "../lib";
import { ColorForm } from "./color-form";

export const dynamic = "force-dynamic";

const CITY_LABELS: Record<string, string> = {
  puerto_la_cruz: "Puerto La Cruz",
  barcelona: "Barcelona",
  lecheria: "Lechería",
};

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function countMyNotes(supabase: ReturnType<typeof createSupabaseServiceRole>, userId: string) {
  const { count } = await supabase
    .from("zalut_dev_notes")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);
  return count ?? 0;
}

export default async function DevAjustesPage() {
  const user = await requireRole("admin");
  const supabase = createSupabaseServiceRole();

  const [{ data: profile }, { data: authData }, myNotes] = await Promise.all([
    supabase
      .from("zalut_profiles")
      .select("dev_color, full_name, phone, city, avatar_url, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.auth.admin.getUserById(user.id),
    countMyNotes(supabase, user.id),
  ]);

  const current = (profile?.dev_color as string | null) ?? fallbackColor(user.id);
  const authUser = authData?.user;
  const cityLabel = profile?.city ? CITY_LABELS[profile.city] ?? profile.city : "—";

  return (
    <div className="flex flex-col gap-6">
      {/* Identidad */}
      <section className="rounded-2xl border border-line bg-white p-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span
            className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-semibold text-white shrink-0"
            style={{ backgroundColor: current }}
          >
            {(user.email?.[0] ?? "?").toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="text-base font-semibold truncate" style={{ color: current }}>
              {user.email ?? "—"}
            </div>
            <div className="text-xs text-muted">
              Rol: <span className="text-ink font-medium">{user.role}</span> · ID:{" "}
              <code className="text-[11px]">{user.id.slice(0, 8)}…</code>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label="Nombre completo" value={profile?.full_name ?? "—"} />
          <Field label="Teléfono" value={profile?.phone ?? "—"} />
          <Field label="Ciudad" value={cityLabel} />
          <Field label="Notas creadas" value={String(myNotes)} />
          <Field label="Cuenta creada" value={fmtDate(authUser?.created_at ?? profile?.created_at)} />
          <Field label="Último acceso" value={fmtDate(authUser?.last_sign_in_at)} />
          <Field label="Email confirmado" value={authUser?.email_confirmed_at ? "Sí" : "No"} />
          <Field label="Perfil actualizado" value={fmtDate(profile?.updated_at)} />
        </dl>
      </section>

      {/* Color */}
      <section className="rounded-2xl border border-line bg-white p-6 flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">Tu color</h2>
          <p className="text-sm text-muted">
            Tus bloques se marcan con este color en todas las vistas.
          </p>
        </div>
        <ColorForm initial={current} email={user.email ?? "—"} />
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
