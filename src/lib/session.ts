import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "l8_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret"
);

export type SessionUser = {
  id: number;
  role: "ADMIN" | "RETAILER";
  storeName: string;
  email: string;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as number,
      role: payload.role as SessionUser["role"],
      storeName: payload.storeName as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// Re-checks the DB so deactivated accounts lose access immediately,
// not only when their 30-day token expires.
export async function getActiveUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    role: user.role as SessionUser["role"],
    storeName: user.storeName,
    email: user.email,
  };
}
