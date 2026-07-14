import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { t, type TKey } from "@/lib/i18n";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const FILTERS = ["", "SUBMITTED", "CONFIRMED", "FULFILLED", "CANCELLED"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ status }, lang] = await Promise.all([searchParams, getLang()]);
  const where = status && FILTERS.includes(status as (typeof FILTERS)[number]) ? { status } : {};

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: true, items: true },
      take: 200,
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countMap = new Map(counts.map((c) => [c.status, c._count]));
  const total = counts.reduce((s, c) => s + c._count, 0);

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs whitespace-nowrap ${
      active
        ? "bg-neutral-900 text-white"
        : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
    }`;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        <Link href="/admin/orders" className={chip(!status)}>
          {t(lang, "all")} ({total})
        </Link>
        {FILTERS.slice(1).map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={chip(status === s)}>
            {t(lang, s as TKey)} ({countMap.get(s) ?? 0})
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-neutral-500 py-12 text-center">
          {t(lang, "noOrdersAdmin")}
        </p>
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
                href={`/admin/orders/${o.id}`}
                className={`flex items-center gap-3 bg-white border rounded-lg px-4 py-3 transition-colors hover:border-neutral-400 ${
                  o.status === "SUBMITTED" ? "border-amber-300" : "border-neutral-200"
                }`}
              >
                <span className="font-mono text-xs text-neutral-400">
                  {orderNumber(o.id)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{o.user.storeName}</p>
                  <p className="text-xs text-neutral-500">
                    {o.items.length} {t(lang, "items")} · {cases} {t(lang, "cases")} ·{" "}
                    {formatMoney(priced)}
                    {unpriced > 0 ? ` + ${unpriced} ${t(lang, "tbd")}` : ""}
                  </p>
                </div>
                <StatusBadge label={t(lang, o.status as TKey)} status={o.status} />
                <span className="text-xs text-neutral-400 whitespace-nowrap">
                  {formatDate(o.createdAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
