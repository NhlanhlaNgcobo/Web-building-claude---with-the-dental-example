# The Apple Bros

An ecommerce site for an independent South African retailer of refurbished and
new Apple devices. Catalogue, variant picker, basket, checkout, trade in
calculator, order tracking and a staff area.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, Prisma 7 and
PostgreSQL.

---

## Running it

```bash
npm install
cp .env.example .env        # then set DATABASE_URL and SESSION_SECRET
npm run setup               # migrate, generate the client, seed the shop
npm run dev
```

The shop is at <http://localhost:3000>, the staff area at `/admin`.

`npm run setup` is the one command that gets you from a clean checkout to a
working shop. It runs the migrations, generates the Prisma client and seeds six
categories, sixteen products, around ninety variants with real stock counts, a
thirty model trade in price list, and a handful of orders in different states so
the staff screens have something in them.

### You need a PostgreSQL database

Not SQLite. Two things the shop depends on are PostgreSQL features: the
`CHECK` constraints that make negative stock impossible at the storage layer,
and the row locking that makes the conditional decrement in the order
transaction safe under concurrency. Both are in
`prisma/migrations/20261006120100_stock_integrity/migration.sql`.

Anything that speaks PostgreSQL works: a local install, Docker, Neon, Supabase,
or Vercel Postgres.

---

## What is worth reading first

If you only look at three files, look at these.

### `lib/orders/service.ts`

The order transaction, which is the thing the shop lives or dies on. Most of
what we sell is a single unit, so overselling is not a theoretical problem: it
means phoning somebody to say the device they bought does not exist.

Three layers stop it:

1. **The catalogue never advertises what it does not have.** `fromPriceCents`
   in `lib/catalogue/pricing.ts` is computed from variants that are genuinely in
   stock, so a product card cannot show a price for a configuration nobody can
   buy.
2. **The sale is committed with a conditional decrement**, inside a
   transaction:

   ```ts
   UPDATE "Variant" SET "stockQuantity" = "stockQuantity" - :qty
   WHERE id = :id AND "isActive" AND "stockQuantity" >= :qty
   ```

   The comparison is inside the write. Nothing reads the level, decides in
   JavaScript and then writes, because that pattern looks correct and is a
   race. If the update affects no rows, the stock went while we were looking at
   it, and the customer gets a real number for what is left rather than a
   generic failure.
3. **A `CHECK ("stockQuantity" >= 0)` constraint** in the database, so even a
   future caller that bypasses the service entirely cannot drive a shelf
   negative.

`__tests__/orders.test.ts` fires two orders for the same last unit
simultaneously and asserts that exactly one succeeds.

### `lib/tradein/calculator.ts`

The trade in arithmetic, as a pure function with no I/O, no database and no
clock. Every published rate is a named constant, the rules apply in a fixed
order, and the result carries each deduction with its reason so the customer
can check our working. The same function runs in the browser for the live
figure and on the server when the quote is recorded, so the two cannot
disagree.

### `data/conditions.ts`

The five condition grades, with their guaranteed minimum battery health. This
is the most load-bearing copy on the site. Refurbished electronics has a trust
problem and almost all of it is vague grading, so each grade here is specific
about what the device will look like, what comes with it, and what battery
health is guaranteed.

---

## How it is laid out

```
app/
  (site)/          the shop: home, catalogue, product, basket, checkout,
                   trade in, order tracking, grading, help, legal
  admin/           staff area, outside the (site) group so it inherits none
                   of the shop chrome
  api/             orders, stock, trade in, enquiries, admin
lib/
  catalogue/       pricing (pure) and queries (Prisma)
  orders/          service (the transaction), stock rules (pure), errors
  tradein/         calculator (pure) and service (Prisma)
  providers/       payment and notification seams
  admin/           session, auth, staff queries
  domain/enums.ts  every status and grade, once
  validation/      Zod schemas for every input boundary
data/              catalogue, conditions, store identity, help, legal copy
components/        brand, layout, shop, tradein, admin, ui
prisma/            schema, migrations, seed
__tests__/         pure tests, plus the database-backed order tests
```

The split that matters is **pure core, I/O at the edges**. `pricing.ts`,
`stock.ts` and `calculator.ts` import nothing, construct no dates and touch no
database, which is why the rules can be proven without one. Everything that
talks to Prisma is in a `queries.ts` or a `service.ts`.

---

## Testing

```bash
npm test          # pure tests, no database needed
npm run test:db   # order tests, needs DATABASE_URL
npm run test:all
npm run verify    # copy check, typecheck, lint, pure tests
```

`npm test` covers pricing, stock labelling and the trade in calculator. These
run anywhere and are the fast loop.

`npm run test:db` needs a real PostgreSQL database and **truncates every table
it touches**, so point it at a scratch database rather than your development
one:

```bash
DATABASE_URL=postgresql://localhost:5432/apple_bros_test npm run db:deploy
DATABASE_URL=postgresql://localhost:5432/apple_bros_test npm run test:db
```

Without `DATABASE_URL` the suite skips rather than failing, so `test:all` is
still useful on a machine with no database. A skipped suite is not a passing
suite, though: run these against a real database before deploying.

Two further checks:

- `npm run check:copy` scans `app/`, `components/` and `data/` for em dashes,
  en dashes and words like "demo" or "placeholder" in customer-facing strings.
- `npm run audit:a11y` checks every page for a single `h1`, labelled form
  controls, alt text and heading order.

---

## Payments

**The shop completes an order with no payment gateway configured, and that is
the intended default rather than a gap.** The customer pays by EFT against
their order reference, or by card at the counter when they collect. Both are
ordinary ways to buy in South Africa, both are real, and neither puts a card
number through this site. There is no card form anywhere in the codebase and no
PCI scope.

To add a gateway, write one implementation of the `PaymentProvider` interface
in `lib/providers/payment/types.ts` and set `PAYMENT_PROVIDER`. Nothing in the
order flow changes, because the order flow only ever talks to that interface.
`lib/providers/payment/index.ts` carries notes on Yoco, PayFast, Peach and
Ozow, including the specific things that catch people out with each one.

Two rules hold whichever provider you add:

- Stock is committed **before** payment is initiated. An order exists before
  any money is asked for, so a payment can never succeed against stock we do
  not have.
- The redirect back from a gateway is a URL the customer can type by hand. It
  may only trigger a server-side verify, never mark an order paid on its own.

---

## Notifications

`lib/providers/notifications/index.ts`. With nothing configured, messages are
written to the server log and nothing is sent.

That is why the order confirmation page shows the reference, the totals and the
banking instruction on screen rather than saying "check your email": nothing
the customer needs exists only in a message they might not receive. Keep that
property if you add a transport.

---

## Deploying to Vercel

1. Push the repository and import it on Vercel.
2. Add a Postgres database from the Storage tab. It sets `DATABASE_URL`.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployment origin, with no trailing slash.
4. Set `ADMIN_PASSWORD` and `SESSION_SECRET`
   (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
5. Leave `DEMO_NOINDEX=true` until the real contact details and prices are in.
6. Deploy, then run the migrations and seed against the deployment database:

   ```bash
   vercel env pull .env.production.local
   DATABASE_URL="..." npm run setup
   ```

`npm run build` runs `prisma generate` first, and `postinstall` does too, so the
client is always generated for the platform it will run on.

The build does not require the database to be reachable. `generateStaticParams`
falls back to rendering those pages on demand, and the Prisma client is created
on first query rather than at import. A database outage should not fail a
deployment.

---

## Before this goes live

Everything in this list is a placeholder that is plausible enough to be
believed, which is exactly why each one has to be replaced.

- [ ] **`data/store.ts`**: the telephone number, WhatsApp number, email and
      address are invented. A deployment carrying them could send somebody to a
      building that is not the shop.
- [ ] **Prices.** The catalogue in `data/catalogue.ts` is realistic South
      African pricing but it is not this shop's pricing. Same for the trade in
      price list in `data/tradein-models.ts`.
- [ ] **Photography.** Every image is a stock photograph from Unsplash, listed
      in `data/images.ts`. Swapping in the shop's own product shots is a
      single-file change. Shoot on white at a consistent distance: a grid of
      cut-out devices is what makes a catalogue look expensive.
- [ ] **Banking details** for EFT orders, via the `EFT_*` environment
      variables. Until they are set, the confirmation says the details will
      follow rather than printing an empty block.
- [ ] **The legal pages.** `data/legal.ts` is drafted against the Consumer
      Protection Act and POPIA and is written to be read rather than to be
      impenetrable. It is a starting point and is not legal advice. Have it
      reviewed.
- [ ] **Remove `DEMO_NOINDEX`** only once all of the above are done. While it
      is set, the site serves a disallow-all `robots.txt` and a `noindex`
      header, which is what keeps invented prices and a wrong telephone number
      out of search results.
- [ ] **Run the database-backed tests** against the production database engine.

---

## Things that were decided deliberately

A few choices that look like omissions and are not.

**No customer accounts.** Order tracking takes a reference plus the email the
order was placed with. An account is a password for the customer to forget and
a credential store for the shop to protect, and almost nobody buys a phone often
enough to want one.

**No reviews, ratings or testimonials.** There are none to publish, so there is
no component rendering them and no `aggregateRating` in the structured data.
Inventing them would be a lie to the customer and a manual action waiting to
happen.

**The shop never invents scarcity.** `stockLabel` in `lib/orders/stock.ts` says
"In stock" with no number when there is plenty, and the test for it asserts
that the string contains no digit. "Only 2 left" appears only when there are
genuinely two.

**No saving is shown unless it is real.** `savingFor` returns null when there is
no comparison price, when the comparison is at or below the selling price, and
when the difference rounds to under one percent.

**The independence notice is prominent.** We sell Apple devices and we are not
Apple. That is stated in the footer, on the about page, in the metadata and in
the structured data, because the customer needs to know whose warranty they are
holding before they buy rather than after something goes wrong.

**Red is an accent, not a surface.** The palette is white first, near-black
type, with the red from the logo used for the mark, focus rings, emphasis and
the add-to-basket action. There are no gradients anywhere except inside
`components/brand/Logo.tsx`, where they reproduce the supplied brand asset.
