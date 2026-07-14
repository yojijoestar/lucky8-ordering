import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type CatalogEntry = {
  sku: string;
  nameEn: string;
  nameZh: string;
  brand: string;
  category: string;
  packSize: string;
  imagePath: string | null;
  sortOrder: number;
};

async function seedUsers() {
  const users = [
    {
      email: "admin@lucky8trading.com",
      password: "lucky8admin",
      role: "ADMIN",
      storeName: "Lucky 8 Trading",
      contactName: "Admin",
      phone: "(888) 830-9628",
      address: "20991 Cabot Blvd, Hayward, CA 94545",
    },
    {
      email: "demo1@example.com",
      password: "demo1234",
      role: "RETAILER",
      storeName: "Golden Gate Market",
      contactName: "Demo One",
      phone: "(415) 555-0101",
      address: "San Francisco, CA",
    },
    {
      email: "demo2@example.com",
      password: "demo1234",
      role: "RETAILER",
      storeName: "Sunset Grocery",
      contactName: "Demo Two",
      phone: "(510) 555-0102",
      address: "Oakland, CA",
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        role: u.role,
        storeName: u.storeName,
        contactName: u.contactName,
        phone: u.phone,
        address: u.address,
      },
    });
  }
  console.log(`Seeded ${users.length} users`);
}

async function seedProducts() {
  const file = path.join(__dirname, "..", "data", "catalog.json");
  if (!fs.existsSync(file)) {
    console.log("data/catalog.json not found - skipping products");
    return;
  }
  const entries: CatalogEntry[] = JSON.parse(fs.readFileSync(file, "utf8"));
  let n = 0;
  for (const p of entries) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        nameEn: p.nameEn,
        nameZh: p.nameZh,
        brand: p.brand,
        category: p.category,
        packSize: p.packSize,
        imagePath: p.imagePath,
        sortOrder: p.sortOrder,
      },
      create: {
        sku: p.sku,
        nameEn: p.nameEn,
        nameZh: p.nameZh,
        brand: p.brand,
        category: p.category,
        packSize: p.packSize,
        imagePath: p.imagePath,
        sortOrder: p.sortOrder,
      },
    });
    n++;
  }
  console.log(`Upserted ${n} products`);
}

async function main() {
  await seedUsers();
  await seedProducts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
