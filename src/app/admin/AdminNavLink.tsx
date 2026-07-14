"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`whitespace-nowrap pb-0.5 ${
        active
          ? "text-neutral-900 border-b-2 border-neutral-900"
          : "text-neutral-500 hover:text-neutral-900"
      }`}
    >
      {label}
    </Link>
  );
}
