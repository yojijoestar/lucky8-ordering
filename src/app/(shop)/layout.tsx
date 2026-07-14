import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveUser } from "@/lib/session";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { logout } from "@/app/actions/auth";
import LanguageToggle from "@/components/LanguageToggle";
import { CartProvider } from "@/components/cart";
import CartBadge from "@/components/CartBadge";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getActiveUser();
  if (!user) redirect("/login");
  const lang = await getLang();

  return (
    <CartProvider>
      <div className="min-h-screen bg-neutral-50">
        <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/" className="font-medium text-neutral-900 whitespace-nowrap">
              <span className="sm:hidden">Lucky 8</span>
              <span className="hidden sm:inline">{t(lang, "appName")}</span>
            </Link>
            <span className="hidden md:inline text-xs text-neutral-400 truncate">
              {user.storeName}
            </span>
            <nav className="ml-auto flex items-center gap-3 sm:gap-4 text-sm">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin/orders"
                  className="text-neutral-600 hover:text-neutral-900 whitespace-nowrap"
                >
                  ← {t(lang, "adminBack")}
                </Link>
              )}
              <Link
                href="/orders"
                className="text-neutral-600 hover:text-neutral-900 whitespace-nowrap"
              >
                {t(lang, "myOrders")}
              </Link>
              <CartBadge label={t(lang, "cart")} />
              <LanguageToggle lang={lang} />
              <form action={logout}>
                <button
                  type="submit"
                  className="text-neutral-400 hover:text-neutral-700 whitespace-nowrap"
                  title={t(lang, "signOut")}
                >
                  {t(lang, "signOut")}
                </button>
              </form>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </div>
    </CartProvider>
  );
}
