import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import CatalogBrowser from "./CatalogBrowser";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const [products, lang] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        sku: true,
        nameEn: true,
        nameZh: true,
        brand: true,
        packSize: true,
        priceCents: true,
        imagePath: true,
      },
    }),
    getLang(),
  ]);

  return <CatalogBrowser products={products} lang={lang} />;
}
