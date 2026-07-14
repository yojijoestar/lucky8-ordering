import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { t, type TKey } from "@/lib/i18n";
import { daysOverdue, formatDate, formatMoney, orderNumber } from "@/lib/format";
import { setInvoiceStatus } from "@/app/actions/admin";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

type AgingFilter = "unpaid" | "0-30" | "31-60" | "60+" | "paid";

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const [{ f }, lang] = await Promise.all([searchParams, getLang()]);
  const filter = (f ?? "unpaid") as AgingFilter;

  const all = await prisma.invoice.findMany({
    include: { user: true },
    orderBy: { dueAt: "asc" },
  });

  const unpaid = all.filter((i) => i.status !== "PAID");
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const outstanding = unpaid.reduce((s, i) => s + i.amountCents, 0);
  const overdue60 = unpaid
    .filter((i) => daysOverdue(i.dueAt) > 60)
    .reduce((s, i) => s + i.amountCents, 0);
  const paidThisMonth = all
    .filter((i) => i.status === "PAID" && i.paidAt && i.paidAt >= monthStart)
    .reduce((s, i) => s + i.amountCents, 0);

  const bucket = (inv: (typeof all)[number]) => {
    const d = daysOverdue(inv.dueAt);
    if (inv.status === "PAID") return "paid";
    if (d <= 0) return "unpaid";
    if (d <= 30) return "0-30";
    if (d <= 60) return "31-60";
    return "60+";
  };
  const list = all.filter((i) => {
    if (filter === "paid") return i.status === "PAID";
    if (filter === "unpaid") return i.status !== "PAID";
    return i.status !== "PAID" && bucket(i) === filter;
  });

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs whitespace-nowrap ${
      active
        ? "bg-neutral-900 text-white"
        : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
    }`;

  const filters: { key: AgingFilter; label: string }[] = [
    { key: "unpaid", label: t(lang, "unpaidFilter") },
    { key: "0-30", label: t(lang, "aging0_30") },
    { key: "31-60", label: t(lang, "aging31_60") },
    { key: "60+", label: t(lang, "aging60plus") },
    { key: "paid", label: t(lang, "paidFilter") },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5 max-w-2xl">
        <Tile label={t(lang, "outstanding")} value={formatMoney(outstanding)!} />
        <Tile
          label={t(lang, "overdue60")}
          value={formatMoney(overdue60)!}
          tone={overdue60 > 0 ? "text-red-700" : ""}
        />
        <Tile
          label={t(lang, "paidThisMonth")}
          value={formatMoney(paidThisMonth)!}
          tone="text-green-700"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4">
        {filters.map((fl) => (
          <Link key={fl.key} href={`/admin/invoices?f=${fl.key}`} className={chip(filter === fl.key)}>
            {fl.label}
          </Link>
        ))}
        <Link
          href="/admin/invoices/new"
          className="ml-auto text-xs border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-100 whitespace-nowrap"
        >
          + {t(lang, "newInvoice")}
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-neutral-500 py-12 text-center">{t(lang, "noInvoices")}</p>
      ) : (
        <div className="space-y-2">
          {list.map((inv) => {
            const d = daysOverdue(inv.dueAt);
            return (
              <div
                key={inv.id}
                className="flex items-center gap-3 bg-white border border-neutral-200 rounded-lg px-4 py-3 flex-wrap"
              >
                <span className="font-mono text-xs text-neutral-400">{inv.invoiceNumber}</span>
                <div className="flex-1 min-w-40">
                  <p className="text-sm font-medium">{inv.user.storeName}</p>
                  <p className="text-xs text-neutral-500">
                    {inv.orderId ? `${t(lang, "order")} ${orderNumber(inv.orderId)} · ` : ""}
                    {t(lang, "issued")} {formatDate(inv.issuedAt)} · {t(lang, "due")}{" "}
                    {formatDate(inv.dueAt)}
                    {inv.note ? ` · ${inv.note}` : ""}
                  </p>
                </div>
                <span className="text-sm font-medium">{formatMoney(inv.amountCents)}</span>
                {inv.status === "PAID" ? (
                  <StatusBadge label={t(lang, "PAID")} status="PAID" />
                ) : d > 0 ? (
                  <StatusBadge label={`${d} ${t(lang, "daysOverdue")}`} status="OVERDUE" />
                ) : (
                  <StatusBadge label={t(lang, "notDue")} status="CONFIRMED" />
                )}
                {inv.status !== "PAID" && (
                  <form action={setInvoiceStatus}>
                    <input type="hidden" name="invoiceId" value={inv.id} />
                    <input type="hidden" name="status" value="PAID" />
                    <button
                      type="submit"
                      className="text-xs border border-neutral-300 rounded-md px-3 py-1.5 hover:bg-neutral-100"
                    >
                      {t(lang, "markPaid")}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-xl font-medium mt-0.5 ${tone}`}>{value}</p>
    </div>
  );
}
