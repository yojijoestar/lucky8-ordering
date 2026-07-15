"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { t, productName, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/components/cart";

type P = {
  id: number;
  sku: string;
  nameEn: string;
  nameZh: string;
  brand: string;
  packSize: string;
  priceCents: number | null;
  imagePath: string | null;
};

const BATCH = 24;

export default function CatalogBrowser({
  products,
  lang,
}: {
  products: P[];
  lang: Lang;
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const topBrands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products)
      if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([b]) => b);
  }, [products]);

  const allBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (brand && p.brand !== brand) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameZh.includes(query.trim()) ||
        p.brand.toLowerCase().includes(q)
      );
    });
  }, [products, query, brand]);

  // Render cards in batches: first batch paints immediately, the rest
  // stream in as the sentinel below the grid scrolls into view.
  useEffect(() => {
    setVisibleCount(BATCH);
  }, [query, brand]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= filtered.length) return;
    const loadMore = () =>
      setVisibleCount((n) => Math.min(n + BATCH, filtered.length));
    // Recreated whenever visibleCount changes so it fires again
    // immediately if the sentinel is still within the margin zone.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    // Scroll fallback: browsers throttle IntersectionObserver in
    // background/embedded tabs; a passive scroll check always works.
    let lastCheck = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastCheck < 120) return; // throttle without rAF —
      lastCheck = now; // rAF is paused in hidden/embedded tabs
      const rect = el.getBoundingClientRect();
      if (rect.top < (window.innerHeight || 720) + 600) loadMore();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [filtered.length, visibleCount]);

  const visible = filtered.slice(0, visibleCount);

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
      active
        ? "bg-neutral-900 text-white"
        : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
    }`;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(lang, "searchPlaceholder")}
          className="flex-1 border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="border border-neutral-300 rounded-md px-2 py-2 text-sm bg-white text-neutral-700 max-w-56"
        >
          <option value="">
            {t(lang, "allBrands")} ({products.length})
          </option>
          {allBrands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button type="button" className={chip(brand === "")} onClick={() => setBrand("")}>
          {t(lang, "allBrands")}
        </button>
        {topBrands.map((b) => (
          <button
            key={b}
            type="button"
            className={chip(brand === b)}
            onClick={() => setBrand(brand === b ? "" : b)}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map((p) => (
          <ProductCard key={p.id} p={p} lang={lang} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      {visibleCount < filtered.length && (
        <div className="text-center py-4">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((n) => Math.min(n + BATCH, filtered.length))
            }
            className="text-xs text-neutral-500 border border-neutral-300 rounded-full px-4 py-1.5 hover:bg-neutral-100"
          >
            {visibleCount} / {filtered.length} ↓
          </button>
        </div>
      )}
      {filtered.length === 0 && (
        <p className="text-sm text-neutral-500 py-12 text-center">
          {lang === "zh" ? "沒有符合的產品" : "No matching products"}
        </p>
      )}
    </div>
  );
}

function ProductCard({ p, lang }: { p: P; lang: Lang }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const names = productName(lang, p);
  const price = formatMoney(p.priceCents);

  function handleAdd() {
    add(
      {
        productId: p.id,
        sku: p.sku,
        nameEn: p.nameEn,
        nameZh: p.nameZh,
        packSize: p.packSize,
        priceCents: p.priceCents,
        imagePath: p.imagePath,
      },
      qty
    );
    setQty(1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col">
      <div className="aspect-square bg-white flex items-center justify-center p-2">
        {p.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imagePath}
            alt={p.nameEn || p.sku}
            loading="lazy"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-neutral-300 text-xs">{p.sku}</span>
        )}
      </div>
      <div className="p-3 pt-2 flex flex-col flex-1 border-t border-neutral-100">
        <p className="text-[11px] text-neutral-500 font-mono">{p.sku}</p>
        <p className="text-sm font-medium text-neutral-900 leading-snug">
          {names.primary}
        </p>
        {names.secondary && (
          <p className="text-xs text-neutral-600 leading-snug">{names.secondary}</p>
        )}
        <p className="text-[11px] text-neutral-500 mt-1">{p.packSize}</p>
        <div className="flex items-center justify-between mt-2">
          {price ? (
            <span className="text-sm font-medium text-neutral-900">
              {price}
              <span className="text-[11px] text-neutral-500 font-normal">
                {t(lang, "perCase")}
              </span>
            </span>
          ) : (
            <span className="text-xs text-neutral-500">{t(lang, "callForPrice")}</span>
          )}
          <div className="flex items-center border border-neutral-300 rounded-md text-sm">
            <button
              type="button"
              className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-100"
              onClick={() => setQty(Math.max(1, qty - 1))}
              aria-label="decrease"
            >
              −
            </button>
            <span className="px-1.5 min-w-6 text-center text-neutral-900">{qty}</span>
            <button
              type="button"
              className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-100"
              onClick={() => setQty(qty + 1)}
              aria-label="increase"
            >
              +
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className={`mt-2 rounded-md py-1.5 text-xs transition-colors ${
            justAdded
              ? "bg-green-700 text-white"
              : "bg-neutral-900 text-white hover:bg-neutral-700"
          }`}
        >
          {justAdded ? `✓ ${t(lang, "added")}` : t(lang, "addToCart")}
        </button>
      </div>
    </div>
  );
}
