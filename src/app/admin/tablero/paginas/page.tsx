import { redirect } from "next/navigation";
import { getGeneralPageId } from "../lib";

export const dynamic = "force-dynamic";

export default async function PaginasIndexPage() {
  const generalId = await getGeneralPageId();
  redirect(generalId ? `/admin/tablero/paginas/${generalId}` : "/admin/tablero");
}
