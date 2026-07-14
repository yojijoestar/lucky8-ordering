import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import RetailerManager from "./RetailerManager";

export const dynamic = "force-dynamic";

export default async function AdminRetailersPage() {
  const [lang, retailers] = await Promise.all([
    getLang(),
    prisma.user.findMany({
      where: { role: "RETAILER" },
      orderBy: { storeName: "asc" },
      select: {
        id: true,
        email: true,
        storeName: true,
        contactName: true,
        phone: true,
        address: true,
        active: true,
        _count: { select: { orders: true, invoices: true } },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-lg font-medium mb-4">{t(lang, "retailers")}</h1>
      <RetailerManager lang={lang} retailers={retailers} />
    </div>
  );
}
