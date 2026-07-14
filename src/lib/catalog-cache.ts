import { prisma } from "./db";
import type { Product } from "@prisma/client";

// The catalog changes only when the admin edits a product or a new
// import runs, so serve it from memory instead of hitting Neon on
// every page view (Neon's free tier cold-starts after idle).
const TTL_MS = 5 * 60 * 1000;

const globalForCache = globalThis as unknown as {
  productCache?: { at: number; products: Product[] } | null;
};

export async function getAllProducts(): Promise<Product[]> {
  const cached = globalForCache.productCache;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.products;
  const products = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
  });
  globalForCache.productCache = { at: Date.now(), products };
  return products;
}

export function bustProductCache() {
  globalForCache.productCache = null;
}
