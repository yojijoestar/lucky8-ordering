"use client";

import { useActionState } from "react";
import {
  createRetailer,
  resetRetailerPassword,
  toggleRetailerActive,
} from "@/app/actions/admin";
import { t, type Lang, type TKey } from "@/lib/i18n";

type Retailer = {
  id: number;
  email: string;
  storeName: string;
  contactName: string;
  phone: string;
  address: string;
  active: boolean;
  _count: { orders: number; invoices: number };
};

const inputCls =
  "w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400";
const btnCls =
  "text-xs border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-100 whitespace-nowrap";

export default function RetailerManager({
  lang,
  retailers,
}: {
  lang: Lang;
  retailers: Retailer[];
}) {
  const [createState, createAction, creating] = useActionState(createRetailer, null);
  const [resetState, resetAction] = useActionState(resetRetailerPassword, null);

  const revealed = createState?.password
    ? createState
    : resetState?.password
      ? resetState
      : null;

  return (
    <div className="grid lg:grid-cols-3 gap-5 items-start">
      <div className="lg:col-span-2 space-y-2">
        {revealed && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
            <span className="font-medium">{revealed.email}</span> —{" "}
            {t(lang, "passwordIs")}{" "}
            <code className="font-mono bg-white border border-green-200 rounded px-1.5 py-0.5">
              {revealed.password}
            </code>
            <p className="text-xs text-green-800 mt-1">{t(lang, "shareWithRetailer")}</p>
          </div>
        )}
        {retailers.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 bg-white border border-neutral-200 rounded-lg px-4 py-3 flex-wrap ${
              r.active ? "" : "opacity-60"
            }`}
          >
            <div className="flex-1 min-w-44">
              <p className="text-sm font-medium">
                {r.storeName}{" "}
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ml-1 ${
                    r.active
                      ? "bg-green-50 text-green-800 border-green-200"
                      : "bg-neutral-100 text-neutral-500 border-neutral-200"
                  }`}
                >
                  {r.active ? t(lang, "activeLabel") : t(lang, "disabledLabel")}
                </span>
              </p>
              <p className="text-xs text-neutral-500">
                {r.email}
                {r.contactName ? ` · ${r.contactName}` : ""}
                {r.phone ? ` · ${r.phone}` : ""}
              </p>
              <p className="text-xs text-neutral-400">
                {r._count.orders} {t(lang, "orders").toLowerCase()} · {r._count.invoices}{" "}
                {t(lang, "invoices").toLowerCase()}
              </p>
            </div>
            <form action={resetAction}>
              <input type="hidden" name="userId" value={r.id} />
              <button type="submit" className={btnCls}>
                {t(lang, "resetPassword")}
              </button>
            </form>
            <form action={toggleRetailerActive}>
              <input type="hidden" name="userId" value={r.id} />
              <button
                type="submit"
                className={`${btnCls} ${r.active ? "text-red-700" : "text-green-700"}`}
              >
                {r.active ? t(lang, "deactivate") : t(lang, "reactivate")}
              </button>
            </form>
          </div>
        ))}
      </div>

      <form
        action={createAction}
        className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3"
      >
        <p className="font-medium text-sm">+ {t(lang, "newRetailer")}</p>
        <input name="storeName" required placeholder={t(lang, "storeName")} className={inputCls} />
        <input name="email" type="email" required placeholder={t(lang, "email")} className={inputCls} />
        <input name="contactName" placeholder={t(lang, "contactName")} className={inputCls} />
        <input name="phone" placeholder={t(lang, "phone")} className={inputCls} />
        <input name="address" placeholder={t(lang, "address")} className={inputCls} />
        {createState?.error && (
          <p className="text-sm text-red-700">{t(lang, createState.error as TKey)}</p>
        )}
        <button
          type="submit"
          disabled={creating}
          className="w-full bg-neutral-900 text-white rounded-md py-2 text-sm hover:bg-neutral-700 disabled:opacity-60"
        >
          {t(lang, "create")}
        </button>
      </form>
    </div>
  );
}
