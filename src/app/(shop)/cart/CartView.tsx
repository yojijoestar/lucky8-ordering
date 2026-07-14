"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart";
import { t, productName, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import { submitOrder } from "@/app/actions/orders";

export default function CartView({ lang }: { lang: Lang }) {
  const cart = useCart();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    const res = await submitOrder({
      items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })),
      note,
    });
    if ("error" in res) {
      setError(t(lang, "somethingWrong"));
      setSubmitting(false);
      return;
    }
    cart.clear();
    router.push(`/orders/${res.orderId}?submitted=1`);
  }

  if (!cart.loaded) return null;

  if (cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-lg font-medium text-neutral-800">{t(lang, "emptyCart")}</p>
        <p className="text-sm text-neutral-500 mt-1">{t(lang, "emptyCartBody")}</p>
        <Link
          href="/"
          className="inline-block mt-5 bg-neutral-900 text-white text-sm rounded-md px-5 py-2 hover:bg-neutral-700"
        >
          {t(lang, "browseCatalog")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-medium mb-4">
        {t(lang, "yourOrder")} — {cart.items.length}{" "}
        {t(lang, cart.items.length === 1 ? "item" : "items")}
      </h1>
      <div className="bg-white border border-neutral-200 rounded-xl px-4 divide-y divide-neutral-100">
        {cart.items.map((i) => {
          const names = productName(lang, i);
          return (
            <div key={i.productId} className="flex items-center gap-3 py-3">
              <div className="w-12 h-12 shrink-0 rounded-md bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden">
                {i.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.imagePath} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[9px] text-neutral-300">{i.sku}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug truncate">
                  {names.primary}{" "}
                  <span className="text-[11px] text-neutral-400 font-mono font-normal">
                    {i.sku}
                  </span>
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {i.priceCents != null
                    ? `${formatMoney(i.priceCents)}${t(lang, "perCase")}`
                    : t(lang, "priceTbdNote")}
                  {i.packSize ? ` · ${i.packSize}` : ""}
                </p>
              </div>
              <div className="flex items-center border border-neutral-300 rounded-md text-sm">
                <button
                  type="button"
                  className="px-2 py-0.5 text-neutral-500 hover:bg-neutral-100"
                  onClick={() => cart.setQty(i.productId, i.qty - 1)}
                >
                  −
                </button>
                <span className="px-1.5 min-w-6 text-center">{i.qty}</span>
                <button
                  type="button"
                  className="px-2 py-0.5 text-neutral-500 hover:bg-neutral-100"
                  onClick={() => cart.setQty(i.productId, i.qty + 1)}
                >
                  +
                </button>
              </div>
              <span className="text-sm font-medium w-20 text-right">
                {i.priceCents != null
                  ? formatMoney(i.priceCents * i.qty)
                  : t(lang, "tbd")}
              </span>
              <button
                type="button"
                onClick={() => cart.remove(i.productId)}
                className="text-neutral-300 hover:text-red-600 text-sm px-1"
                aria-label={t(lang, "remove")}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 bg-white border border-neutral-200 rounded-xl p-4">
        <div className="flex justify-between text-sm text-neutral-500">
          <span>
            {cart.totalCases} {t(lang, "casesTotal")}
          </span>
          <span>{t(lang, "subtotal")}</span>
        </div>
        <div className="flex justify-end text-lg font-medium mt-0.5">
          {formatMoney(cart.subtotalCents)}
          {cart.unpricedCount > 0 && (
            <span className="text-sm font-normal text-neutral-400 ml-1.5 self-center">
              + {cart.unpricedCount} {t(lang, "tbd")}
            </span>
          )}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`${t(lang, "orderNote")} — ${t(lang, "orderNotePlaceholder")}`}
          rows={2}
          className="mt-3 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="mt-3 w-full bg-neutral-900 text-white rounded-md py-2.5 text-sm hover:bg-neutral-700 disabled:opacity-60"
        >
          {submitting ? t(lang, "submitting") : t(lang, "submitOrder")}
        </button>
        <p className="text-xs text-neutral-400 text-center mt-2">
          {t(lang, "noPaymentNote")}
        </p>
      </div>
    </div>
  );
}
