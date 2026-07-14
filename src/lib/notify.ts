import { formatMoney, orderNumber } from "./format";

type OrderForEmail = {
  id: number;
  note: string;
  user: { storeName: string; contactName: string; phone: string; email: string };
  items: {
    sku: string;
    nameEn: string;
    quantity: number;
    unitPriceCents: number | null;
  }[];
};

export async function notifyNewOrder(order: OrderForEmail) {
  const to = process.env.ORDER_ALERT_EMAIL;
  const lines = order.items
    .map(
      (i) =>
        `${i.sku}  x${i.quantity}  ${i.nameEn}  ${
          i.unitPriceCents != null
            ? formatMoney(i.unitPriceCents * i.quantity)
            : "price TBD"
        }`
    )
    .join("\n");
  const subtotal = order.items.reduce(
    (s, i) => s + (i.unitPriceCents != null ? i.unitPriceCents * i.quantity : 0),
    0
  );
  const subject = `New order ${orderNumber(order.id)} from ${order.user.storeName}`;
  const text = [
    `Store: ${order.user.storeName}`,
    `Contact: ${order.user.contactName} ${order.user.phone} ${order.user.email}`,
    order.note ? `Note: ${order.note}` : null,
    ``,
    lines,
    ``,
    `Subtotal (priced items): ${formatMoney(subtotal)}`,
  ]
    .filter((l) => l != null)
    .join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) {
    console.log(`[order-email] ${subject}\n${text}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.ORDER_ALERT_FROM ?? "orders@resend.dev",
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) console.error("[order-email] send failed:", await res.text());
  } catch (e) {
    // Never fail the order because the email failed.
    console.error("[order-email] send error:", e);
  }
}
