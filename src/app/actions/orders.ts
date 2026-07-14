"use server";

import { prisma } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import { notifyNewOrder } from "@/lib/notify";

export async function submitOrder(input: {
  items: { productId: number; qty: number }[];
  note: string;
}): Promise<{ orderId: number } | { error: string }> {
  const user = await getActiveUser();
  if (!user) return { error: "invalidCredentials" };

  const clean = input.items
    .map((i) => ({ productId: Math.trunc(i.productId), qty: Math.trunc(i.qty) }))
    .filter((i) => i.qty > 0 && i.qty <= 9999);
  if (clean.length === 0) return { error: "somethingWrong" };

  // Snapshot prices/names from the DB, never from the client.
  const products = await prisma.product.findMany({
    where: { id: { in: clean.map((i) => i.productId) }, active: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = clean.filter((i) => byId.has(i.productId));
  if (items.length === 0) return { error: "somethingWrong" };

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      note: input.note.slice(0, 2000),
      items: {
        create: items.map((i) => {
          const p = byId.get(i.productId)!;
          return {
            productId: p.id,
            quantity: i.qty,
            unitPriceCents: p.priceCents,
            sku: p.sku,
            nameEn: p.nameEn,
            nameZh: p.nameZh,
          };
        }),
      },
    },
    include: { items: true, user: true },
  });

  await notifyNewOrder(order);
  return { orderId: order.id };
}
