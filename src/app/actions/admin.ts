"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import { bustProductCache } from "@/lib/catalog-cache";

const ORDER_STATUSES = ["SUBMITTED", "CONFIRMED", "FULFILLED", "CANCELLED"];

async function requireAdmin() {
  const user = await getActiveUser();
  if (!user || user.role !== "ADMIN") throw new Error("forbidden");
  return user;
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("orderId"));
  const status = String(formData.get("status"));
  if (!ORDER_STATUSES.includes(status)) throw new Error("bad status");
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function deleteOrder(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("orderId"));
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return;
  // Invoices are financial records — never delete them implicitly.
  // Keep them as standalone per-retailer invoices instead.
  await prisma.$transaction([
    prisma.invoice.updateMany({ where: { orderId: id }, data: { orderId: null } }),
    prisma.orderItem.deleteMany({ where: { orderId: id } }),
    prisma.order.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/orders");
  redirect("/admin/orders");
}

export async function createInvoice(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  await requireAdmin();
  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim();
  const userId = Number(formData.get("userId"));
  const orderIdRaw = String(formData.get("orderId") ?? "").trim();
  const amount = Math.round(parseFloat(String(formData.get("amount"))) * 100);
  // Parse date-only strings at local noon so the calendar date never
  // shifts across timezones (UTC-midnight parsing shows the prior day in the US).
  const issuedAt = new Date(`${formData.get("issuedAt")}T12:00:00`);
  const dueAt = new Date(`${formData.get("dueAt")}T12:00:00`);
  const note = String(formData.get("note") ?? "").slice(0, 1000);

  if (!invoiceNumber || !userId || !Number.isFinite(amount) || amount < 0)
    return { error: "required" };
  if (isNaN(issuedAt.getTime()) || isNaN(dueAt.getTime()))
    return { error: "required" };

  const exists = await prisma.invoice.findUnique({ where: { invoiceNumber } });
  if (exists) return { error: "invoiceExists" };

  let orderId: number | null = null;
  if (orderIdRaw) {
    const parsed = Number(orderIdRaw.replace(/^ORD-?/i, ""));
    const order = await prisma.order.findUnique({ where: { id: parsed || 0 } });
    if (!order) return { error: "somethingWrong" };
    orderId = order.id;
  }

  await prisma.invoice.create({
    data: { invoiceNumber, userId, orderId, amountCents: amount, issuedAt, dueAt, note },
  });
  revalidatePath("/admin/invoices");
  redirect("/admin/invoices");
}

export async function setInvoiceStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("invoiceId"));
  const status = String(formData.get("status"));
  if (!["UNPAID", "PARTIAL", "PAID"].includes(status)) throw new Error("bad status");
  await prisma.invoice.update({
    where: { id },
    data: { status, paidAt: status === "PAID" ? new Date() : null },
  });
  revalidatePath("/admin/invoices");
}

export async function createRetailer(
  _prev: { error?: string; password?: string; email?: string } | null,
  formData: FormData
): Promise<{ error?: string; password?: string; email?: string } | null> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const storeName = String(formData.get("storeName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!email || !storeName) return { error: "required" };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "emailExists" };

  const password = generatePassword();
  await prisma.user.create({
    data: {
      email,
      storeName,
      contactName,
      phone,
      address,
      role: "RETAILER",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  revalidatePath("/admin/retailers");
  return { password, email };
}

export async function resetRetailerPassword(
  _prev: { password?: string; email?: string } | null,
  formData: FormData
): Promise<{ password?: string; email?: string } | null> {
  await requireAdmin();
  const id = Number(formData.get("userId"));
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "RETAILER") return null;
  const password = generatePassword();
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  return { password, email: user.email };
}

export async function toggleRetailerActive(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("userId"));
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "RETAILER") return;
  await prisma.user.update({ where: { id }, data: { active: !user.active } });
  revalidatePath("/admin/retailers");
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("productId"));
  const priceRaw = String(formData.get("price") ?? "").trim();
  const active = formData.get("active") === "on";
  const priceCents = priceRaw === "" ? null : Math.round(parseFloat(priceRaw) * 100);
  if (priceCents != null && (!Number.isFinite(priceCents) || priceCents < 0)) return;
  await prisma.product.update({ where: { id }, data: { priceCents, active } });
  bustProductCache();
  revalidatePath("/admin/catalog");
  revalidatePath("/");
}

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
