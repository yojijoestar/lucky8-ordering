import Link from "next/link";
import { getAllProducts } from "@/lib/catalog-cache";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { updateProduct } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const [{ q, page }, lang, all] = await Promise.all([
    searchParams,
    getLang(),
    getAllProducts(),
  ]);
  const query = (q ?? "").trim().toLowerCase();

  const matches = query
    ? all.filter(
        (p) =>
          p.sku.toLowerCase().includes(query) ||
          p.nameEn.toLowerCase().includes(query) ||
          p.nameZh.includes((q ?? "").trim()) ||
          p.brand.toLowerCase().includes(query)
      )
    : all;

  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageNum = Math.min(Math.max(1, Number(page) || 1), pageCount);
  const products = matches.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);
  const pageLink = (n: number) =>
    `/admin/catalog?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`;

  return (
    <div>
      <form className="mb-4 flex gap-2" action="/admin/catalog" method="get">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t(lang, "searchProducts")}
          className="w-full max-w-md border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        <span className="self-center text-xs text-neutral-400 whitespace-nowrap">
          {matches.length} / {all.length}
        </span>
      </form>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-175">
          <thead>
            <tr className="text-xs text-neutral-400 text-left border-b border-neutral-200">
              <th className="py-2 px-3 font-normal w-12"></th>
              <th className="font-normal">{t(lang, "sku")}</th>
              <th className="font-normal">{t(lang, "product")}</th>
              <th className="font-normal">{t(lang, "pack")}</th>
              <th className="font-normal text-right">{t(lang, "price")} ($)</th>
              <th className="font-normal text-center">{t(lang, "activeLabel")}</th>
              <th className="font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={`border-b border-neutral-100 ${p.active ? "" : "opacity-50"}`}>
                <td className="py-1.5 px-3">
                  <div className="w-9 h-9 rounded bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden">
                    {p.imagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imagePath} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[8px] text-neutral-300">—</span>
                    )}
                  </div>
                </td>
                <td className="font-mono text-xs text-neutral-500 pr-2">{p.sku}</td>
                <td className="pr-2">
                  <span className="block leading-snug">{p.nameEn || p.nameZh}</span>
                  {p.nameEn && (
                    <span className="block text-xs text-neutral-500 leading-snug">{p.nameZh}</span>
                  )}
                </td>
                <td className="text-xs text-neutral-500 pr-2 whitespace-nowrap">{p.packSize}</td>
                <td colSpan={3}>
                  <form action={updateProduct} className="flex items-center gap-2 justify-end py-1 pr-3">
                    <input type="hidden" name="productId" value={p.id} />
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      min="0"
                      defaultValue={p.priceCents != null ? (p.priceCents / 100).toFixed(2) : ""}
                      placeholder="—"
                      className="w-24 border border-neutral-300 rounded-md px-2 py-1 text-sm text-right"
                    />
                    <label className="flex items-center gap-1 text-xs text-neutral-500">
                      <input type="checkbox" name="active" defaultChecked={p.active} />
                      {t(lang, "visible")}
                    </label>
                    <button
                      type="submit"
                      className="text-xs border border-neutral-300 rounded-md px-2.5 py-1 hover:bg-neutral-100"
                    >
                      {t(lang, "save")}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          {pageNum > 1 ? (
            <Link href={pageLink(pageNum - 1)} className="border border-neutral-300 rounded-md px-3 py-1 hover:bg-neutral-100">
              ←
            </Link>
          ) : (
            <span className="border border-neutral-200 rounded-md px-3 py-1 text-neutral-300">←</span>
          )}
          <span className="text-neutral-500">
            {(pageNum - 1) * PAGE_SIZE + 1}–{Math.min(pageNum * PAGE_SIZE, matches.length)} / {matches.length}
          </span>
          {pageNum < pageCount ? (
            <Link href={pageLink(pageNum + 1)} className="border border-neutral-300 rounded-md px-3 py-1 hover:bg-neutral-100">
              →
            </Link>
          ) : (
            <span className="border border-neutral-200 rounded-md px-3 py-1 text-neutral-300">→</span>
          )}
        </div>
      )}
    </div>
  );
}
