"use client";

import { useState } from "react";
import { useCart } from "@/components/cart";
import { t, type Lang } from "@/lib/i18n";

type ReorderItem = {
  productId: number;
  sku: string;
  nameEn: string;
  nameZh: string;
  packSize: string;
  priceCents: number | null;
  imagePath: string | null;
  qty: number;
  active: boolean;
};

export default function ReorderButton({
  items,
  lang,
}: {
  items: ReorderItem[];
  lang: Lang;
}) {
  const { add } = useCart();
  const [done, setDone] = useState(false);

  function handleReorder() {
    for (const i of items) {
      if (!i.active) continue;
      add(
        {
          productId: i.productId,
          sku: i.sku,
          nameEn: i.nameEn,
          nameZh: i.nameZh,
          packSize: i.packSize,
          priceCents: i.priceCents,
          imagePath: i.imagePath,
        },
        i.qty
      );
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      className={`text-sm rounded-md px-4 py-1.5 transition-colors ${
        done
          ? "bg-green-700 text-white"
          : "bg-neutral-900 text-white hover:bg-neutral-700"
      }`}
    >
      {done ? `✓ ${t(lang, "reorderDone")}` : t(lang, "reorder")}
    </button>
  );
}
