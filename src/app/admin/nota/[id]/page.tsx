import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Vista vieja (nota = una sola tarjeta). El modelo ahora es: página = wrapper de
// bloques distintos. Redirigimos a la vista de página real.
export default async function LegacyNotaRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/tablero/paginas/${id}`);
}
