import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import { getLang } from "@/lib/lang-server";
import { t, productName, type TKey } from "@/lib/i18n";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import ReorderButton from "./ReorderButton";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await getActiveUser();
  if (!user) redirect("/login");
  const [{ id }, { submitted }, lang] = await Promise.all([
    params,
    searchParams,
    getLang(),
  ]);

  const order = await prisma.order.findUnique({
    where: { id: Number(id) || 0 },
    include: { items: { include: { product: true } } },
  });
  if (!order || (order.userId !== user.id && user.role !== "ADMIN")) notFound();

  const cases = order.items.reduce((s, i) => s + i.quantity, 0);
  const priced = order.items.reduce(
    (s, i) => s + (i.unitPriceCents != null ? i.unitPriceCents * i.quantity : 0),
    0
  );
  const unpriced = order.items.filter((i) => i.unitPriceCents == null).length;

  return (
    <div className="max-w-2xl mx-auto">
      {submitted && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="font-medium text-green-900">✓ {t(lang, "orderSubmitted")}</p>
          <p className="text-sm text-green-800 mt-0.5">{t(lang, "orderSubmittedBody")}</p>
        </div>
      )}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-lg font-medium">
          {t(lang, "orderDetail")}{" "}
          <span className="font-mono text-sm text-neutral-400">
            {orderNumber(order.id)}
          </span>
        </h1>
        <StatusBadge label={t(lang, order.status as TKey)} status={order.status} />
        <span className="text-xs text-neutral-400">{formatDate(order.createdAt)}</span>
        <div className="ml-auto">
          <ReorderButton
            lang={lang}
            items={order.items.map((i) => ({
              productId: i.productId,
              sku: i.product.sku,
              nameEn: i.product.nameEn,
              nameZh: i.product.nameZh,
              packSize: i.product.packSize,
              priceCents: i.product.priceCents,
              imagePath: i.product.imagePath,
              qty: i.quantity,
              active: i.product.active,
            }))}
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl px-4 divide-y divide-neutral-100">
        {order.items.map((i) => {
          const names = productName(lang, i);
          return (
            <div key={i.productId} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 shrink-0 rounded-md bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden">
                {i.product.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={i.product.imagePath}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[8px] text-neutral-300">{i.sku}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug truncate">
                  {names.primary}{" "}
                  <span className="text-[11px] text-neutral-400 font-mono">{i.sku}</span>
                </p>
              </div>
              <span className="text-sm text-neutral-500">×{i.quantity}</span>
              <span className="text-sm font-medium w-20 text-right">
                {i.unitPriceCents != null
                  ? formatMoney(i.unitPriceCents * i.quantity)
                  : t(lang, "tbd")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-3 px-1 text-sm">
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
      {order.note && (
        <p className="mt-3 text-sm text-neutral-600 bg-white border border-neutral-200 rounded-lg px-4 py-3">
          {order.note}
        </p>
      )}
      <Link
        href="/orders"
        className="inline-block mt-4 text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← {t(lang, "myOrders")}
      </Link>
    </div>
  );
}
