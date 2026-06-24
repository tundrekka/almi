import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { Wordmark } from "@/components/wordmark";
import { AdminMenu } from "./admin-menu";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="px-4 sm:px-6 h-14 flex items-center gap-3">
          <AdminMenu email={user.email} />
          <Link href="/admin" className="inline-flex items-center">
            <Wordmark className="text-xl" />
          </Link>
        </div>
      </header>

      {children}
    </main>
  );
}
