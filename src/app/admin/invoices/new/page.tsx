import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import NewInvoiceForm from "./NewInvoiceForm";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const [lang, retailers] = await Promise.all([
    getLang(),
    prisma.user.findMany({
      where: { role: "RETAILER" },
      orderBy: { storeName: "asc" },
      select: { id: true, storeName: true },
    }),
  ]);

  return (
    <div className="max-w-md">
      <h1 className="text-lg font-medium mb-4">{t(lang, "newInvoice")}</h1>
      <NewInvoiceForm lang={lang} retailers={retailers} />
    </div>
  );
}
