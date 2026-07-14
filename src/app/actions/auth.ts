"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

export async function login(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "invalidCredentials" };
  }

  await createSession({
    id: user.id,
    role: user.role as "ADMIN" | "RETAILER",
    storeName: user.storeName,
    email: user.email,
  });

  redirect(user.role === "ADMIN" ? "/admin/orders" : "/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
