import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveUser } from "@/lib/session";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { logout } from "@/app/actions/auth";
import LanguageToggle from "@/components/LanguageToggle";
import AdminNavLink from "./AdminNavLink";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getActiveUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  const lang = await getLang();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4 overflow-x-auto">
          <span className="font-medium text-neutral-900 whitespace-nowrap">
            {t(lang, "admin")}
          </span>
          <nav className="flex items-center gap-3 sm:gap-4 text-sm">
            <AdminNavLink href="/admin/orders" label={t(lang, "orders")} />
            <AdminNavLink href="/admin/catalog" label={t(lang, "catalog")} />
            <AdminNavLink href="/admin/invoices" label={t(lang, "invoices")} />
            <AdminNavLink href="/admin/retailers" label={t(lang, "retailers")} />
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-700 whitespace-nowrap">
              {t(lang, "browseCatalog")} →
            </Link>
            <LanguageToggle lang={lang} />
            <form action={logout}>
              <button type="submit" className="text-sm text-neutral-400 hover:text-neutral-700 whitespace-nowrap">
                {t(lang, "signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
