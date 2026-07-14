import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { t, type TKey } from "@/lib/i18n";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import { updateOrderStatus } from "@/app/actions/admin";
import StatusBadge from "@/components/StatusBadge";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, lang] = await Promise.all([params, getLang()]);
  const order = await prisma.order.findUnique({
    where: { id: Number(id) || 0 },
    include: { items: { include: { product: true } }, user: true, invoices: true },
  });
  if (!order) notFound();

  const cases = order.items.reduce((s, i) => s + i.quantity, 0);
  const priced = order.items.reduce(
    (s, i) => s + (i.unitPriceCents != null ? i.unitPriceCents * i.quantity : 0),
    0
  );
  const unpriced = order.items.filter((i) => i.unitPriceCents == null).length;

  const actionBtn =
    "text-xs border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-100 whitespace-nowrap";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 flex-wrap mb-4 print:hidden">
        <Link href="/admin/orders" className="text-sm text-neutral-400 hover:text-neutral-700">
          ← {t(lang, "orders")}
        </Link>
        <StatusBadge label={t(lang, order.status as TKey)} status={order.status} />
        <div className="ml-auto flex items-center gap-2">
          <PrintButton label={t(lang, "print")} />
          <a href={`/admin/orders/${order.id}/csv`} className={actionBtn}>
            ⬇ {t(lang, "exportCsv")}
          </a>
          {order.status === "SUBMITTED" && (
            <form action={updateOrderStatus}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value="CONFIRMED" />
              <button type="submit" className={actionBtn}>{t(lang, "markConfirmed")}</button>
            </form>
          )}
          {order.status === "CONFIRMED" && (
            <form action={updateOrderStatus}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value="FULFILLED" />
              <button type="submit" className={actionBtn}>{t(lang, "markFulfilled")}</button>
            </form>
          )}
          {(order.status === "SUBMITTED" || order.status === "CONFIRMED") && (
            <form action={updateOrderStatus}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value="CANCELLED" />
              <button type="submit" className={`${actionBtn} text-red-700`}>
                {t(lang, "markCancelled")}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-medium">
              {t(lang, "pickSheet")}{" "}
              <span className="font-mono text-sm text-neutral-500">
                {orderNumber(order.id)}
              </span>
            </h1>
            <p className="text-sm mt-1 font-medium">{order.user.storeName}</p>
            <p className="text-xs text-neutral-500">
              {order.user.contactName} · {order.user.phone} · {order.user.email}
            </p>
            {order.user.address && (
              <p className="text-xs text-neutral-500">{order.user.address}</p>
            )}
          </div>
          <p className="text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
        </div>

        {order.note && (
          <p className="mt-3 text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {order.note}
          </p>
        )}

        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="text-xs text-neutral-400 text-left border-b border-neutral-200">
              <th className="py-1.5 font-normal">{t(lang, "sku")}</th>
              <th className="font-normal">{t(lang, "product")}</th>
              <th className="font-normal text-right">{t(lang, "qty")}</th>
              <th className="font-normal text-right">{t(lang, "unitPrice")}</th>
              <th className="font-normal text-right">{t(lang, "lineTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.productId} className="border-b border-neutral-100">
                <td className="py-2 font-mono text-xs">{i.sku}</td>
                <td className="pr-2">
                  <span className="block leading-snug">{i.nameEn}</span>
                  <span className="block text-xs text-neutral-500 leading-snug">
                    {i.nameZh}
                    {i.product.packSize ? ` · ${i.product.packSize}` : ""}
                  </span>
                </td>
                <td className="text-right align-top py-2">{i.quantity}</td>
                <td className="text-right align-top py-2">
                  {i.unitPriceCents != null ? formatMoney(i.unitPriceCents) : t(lang, "tbd")}
                </td>
                <td className="text-right align-top py-2 font-medium">
                  {i.unitPriceCents != null
                    ? formatMoney(i.unitPriceCents * i.quantity)
                    : t(lang, "tbd")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-3 text-sm">
          <span className="text-neutral-500">
            {cases} {t(lang, "casesTotal")}
          </span>
          <span className="font-medium text-base">
            {formatMoney(priced)}
            {unpriced > 0 && (
              <span className="text-sm font-normal text-neutral-400 ml-1">
                + {unpriced} {t(lang, "tbd")}
              </span>
            )}
          </span>
        </div>
      </div>

      {order.invoices.length > 0 && (
        <p className="mt-3 text-xs text-neutral-500 print:hidden">
          {t(lang, "invoices")}:{" "}
          {order.invoices.map((inv) => (
            <Link key={inv.id} href="/admin/invoices" className="underline mr-2">
              {inv.invoiceNumber}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}
