import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import { orderNumber } from "@/lib/format";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getActiveUser();
  if (!user || user.role !== "ADMIN")
    return new NextResponse("Forbidden", { status: 403 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) || 0 },
    include: { items: { include: { product: true } }, user: true },
  });
  if (!order) return new NextResponse("Not found", { status: 404 });

  const esc = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const rows = [
    ["order", orderNumber(order.id)],
    ["store", order.user.storeName],
    ["date", order.createdAt.toISOString().slice(0, 10)],
    order.note ? ["note", order.note] : null,
    [],
    ["sku", "name_en", "name_zh", "pack", "cases", "unit_price", "line_total"],
    ...order.items.map((i) => [
      i.sku,
      i.nameEn,
      i.nameZh,
      i.product.packSize,
      i.quantity,
      i.unitPriceCents != null ? (i.unitPriceCents / 100).toFixed(2) : "",
      i.unitPriceCents != null ? ((i.unitPriceCents * i.quantity) / 100).toFixed(2) : "",
    ]),
  ]
    .filter((r) => r !== null)
    .map((r) => r.map(esc).join(","))
    .join("\n");

  return new NextResponse("﻿" + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${orderNumber(order.id)}.csv"`,
    },
  });
}
