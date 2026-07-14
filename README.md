# Lucky 8 Trading — Wholesale Ordering Platform

Web platform for local retailers to order snack inventory in bulk from
Lucky 8 Trading LLC (Hayward, CA), replacing phone orders written down by
hand. Retailers browse the photo catalog, add cases to a cart, and submit
orders; the distributor manages orders, prices, invoices, and retailer
accounts from an admin dashboard. UI is bilingual (English / 中文).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS — one deployable app
- Prisma ORM — SQLite in dev, Postgres (Neon) in production
- Cookie-session auth (bcrypt password hashing), roles `ADMIN` / `RETAILER`
- Product photos are static files in `public/products/`, parsed from the
  supplier catalog PDF
- Order email alerts: console in dev, Resend API in production

## Local development

```bash
npm install
npx prisma db push        # creates prisma/dev.db (SQLite)
npx prisma db seed        # seeds users + products from data/catalog.json
npm run dev
```

Seeded logins (change in production!):

| Role     | Email                    | Password    |
| -------- | ------------------------ | ----------- |
| Admin    | admin@lucky8trading.com  | lucky8admin |
| Retailer | demo1@example.com        | demo1234    |
| Retailer | demo2@example.com        | demo1234    |

## Catalog import (from the supplier PDF)

```bash
python3 -m venv .venv && .venv/bin/pip install pymupdf
.venv/bin/python scripts/import_catalog.py "/path/to/Catalog Part 1.pdf"
npx prisma db seed        # upserts by SKU — idempotent
```

- Writes `data/catalog.json`, photos to `public/products/<sku>.jpg`, and an
  issue report to `data/import_report.txt` (products with no photo/name).
- Re-run with additional catalog parts; products merge by SKU.
- Prices are not in the PDF. Set them in **Admin → Catalog**, or run a bulk
  CSV price import when the client provides a price list.

## Deploying free (Render + Neon)

1. **Neon** (free): create a project, copy the Postgres connection string.
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to
   `provider = "postgresql"`.
3. **Render** (free): new Web Service from this repo.
   - Build: `npm install && npx prisma db push && npm run build`
   - Start: `npm start`
   - Env vars: `DATABASE_URL` (Neon), `SESSION_SECRET` (long random string),
     `ORDER_ALERT_EMAIL`, optionally `RESEND_API_KEY` + `ORDER_ALERT_FROM`.
4. Seed production once: `DATABASE_URL=... npx prisma db seed`, then change
   the admin password.

Free-tier caveat: Render free services sleep after 15 min idle; first visit
takes ~30–60 s to wake. $7/mo removes this when the client adopts.

## Data model

`User 1—* Order 1—* OrderItem *—1 Product`, `User 1—* Invoice`,
`Invoice *—0..1 Order`. OrderItem uses a composite PK `(orderId, productId)`
and snapshots price/name at order time so history survives price changes.
Order numbers are formatted from the id (`ORD-0043`); invoice numbers are
admin-typed to match the client's accounting books.
