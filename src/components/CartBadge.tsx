"use client";

import Link from "next/link";
import { useCart } from "./cart";

export default function CartBadge({ label }: { label: string }) {
  const { totalCases, loaded } = useCart();
  return (
    <Link
      href="/cart"
      className="relative text-neutral-600 hover:text-neutral-900 pr-1"
    >
      {label}
      {loaded && totalCases > 0 && (
        <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] leading-none rounded-full px-1.5 py-0.5">
          {totalCases}
        </span>
      )}
    </Link>
  );
}
