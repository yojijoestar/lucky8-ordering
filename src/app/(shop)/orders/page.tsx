import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import { getLang } from "@/lib/lang-server";
import { t, type TKey } from "@/lib/i18n";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getActiveUser();
  if (!user) redirect("/login");
  const lang = await getLang();

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-medium mb-4">{t(lang, "myOrders")}</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-neutral-800">{t(lang, "noOrders")}</p>
          <p className="text-sm text-neutral-500 mt-1">{t(lang, "noOrdersBody")}</p>
          <Link
            href="/"
            className="inline-block mt-5 bg-neutral-900 text-white text-sm rounded-md px-5 py-2 hover:bg-neutral-700"
          >
            {t(lang, "browseCatalog")}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const cases = o.items.reduce((s, i) => s + i.quantity, 0);
            const priced = o.items.reduce(
              (s, i) => s + (i.unitPriceCents != null ? i.unitPriceCents * i.quantity : 0),
              0
            );
            const unpriced = o.items.filter((i) => i.unitPriceCents == null).length;
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center gap-3 bg-white border border-neutral-200 rounded-lg px-4 py-3 hover:border-neutral-400 transition-colors"
              >
                <span className="font-mono text-xs text-neutral-400">
                  {orderNumber(o.id)}
                </span>
                <span className="flex-1 text-sm text-neutral-600">
                  {o.items.length} {t(lang, "items")} · {cases} {t(lang, "cases")} ·{" "}
                  {formatMoney(priced)}
                  {unpriced > 0 ? ` + ${unpriced} ${t(lang, "tbd")}` : ""}
                </span>
                <StatusBadge label={t(lang, o.status as TKey)} status={o.status} />
                <span className="text-xs text-neutral-400">{formatDate(o.createdAt)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
