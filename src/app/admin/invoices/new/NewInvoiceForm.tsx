"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createInvoice } from "@/app/actions/admin";
import { t, type Lang, type TKey } from "@/lib/i18n";

export default function NewInvoiceForm({
  lang,
  retailers,
}: {
  lang: Lang;
  retailers: { id: number; storeName: string }[];
}) {
  const [state, formAction, pending] = useActionState(createInvoice, null);
  const input =
    "w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400";
  const label = "block text-sm text-neutral-600 mb-1";
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4 bg-white border border-neutral-200 rounded-xl p-5">
      <div>
        <label className={label} htmlFor="invoiceNumber">{t(lang, "invoiceNumber")}</label>
        <input id="invoiceNumber" name="invoiceNumber" required placeholder="INV-2088" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="userId">{t(lang, "store")}</label>
        <select id="userId" name="userId" required className={input}>
          {retailers.map((r) => (
            <option key={r.id} value={r.id}>{r.storeName}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="orderId">{t(lang, "linkedOrder")}</label>
        <input id="orderId" name="orderId" placeholder="ORD-0001" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="amount">{t(lang, "amount")} ($)</label>
        <input id="amount" name="amount" type="number" step="0.01" min="0" required className={input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="issuedAt">{t(lang, "issued")}</label>
          <input id="issuedAt" name="issuedAt" type="date" required defaultValue={today} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="dueAt">{t(lang, "due")}</label>
          <input id="dueAt" name="dueAt" type="date" required defaultValue={in30} className={input} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="note">{t(lang, "orderNote")}</label>
        <input id="note" name="note" className={input} />
      </div>
      {state?.error && (
        <p className="text-sm text-red-700">{t(lang, state.error as TKey)}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-neutral-900 text-white rounded-md px-5 py-2 text-sm hover:bg-neutral-700 disabled:opacity-60"
        >
          {t(lang, "create")}
        </button>
        <Link
          href="/admin/invoices"
          className="border border-neutral-300 rounded-md px-5 py-2 text-sm hover:bg-neutral-100"
        >
          {t(lang, "cancel")}
        </Link>
      </div>
    </form>
  );
}
