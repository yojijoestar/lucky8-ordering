import { getAllProducts } from "@/lib/catalog-cache";
import { getLang } from "@/lib/lang-server";
import CatalogBrowser from "./CatalogBrowser";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const [all, lang] = await Promise.all([getAllProducts(), getLang()]);
  const products = all
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      sku: p.sku,
      nameEn: p.nameEn,
      nameZh: p.nameZh,
      brand: p.brand,
      packSize: p.packSize,
      priceCents: p.priceCents,
      imagePath: p.imagePath,
    }));

  return <CatalogBrowser products={products} lang={lang} />;
}
