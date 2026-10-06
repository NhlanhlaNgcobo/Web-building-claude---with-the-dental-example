# Deploying to Vercel

This repository holds two applications. Each deploys as its own Vercel
project, and in both cases Vercel has to be told which directory to build
rather than being pointed at the repository root.

- **Harbour Dental Studio**, root directory `dental-clinic-website`. The rest
  of this document walks through it.
- **The Apple Bros**, root directory `apple-bros-store`. The same shape, with
  the differences listed at the end.

**It needs a PostgreSQL database.** The original development database was
SQLite, which cannot work on a serverless platform: the filesystem is
ephemeral and read-only, so every booking, cancellation and diary change would
fail. The schema, migrations and driver adapter are already PostgreSQL.

---

## 1. Create the project

In the Vercel dashboard, import the repository, then set:

| Setting | Value |
|---|---|
| Root Directory | `dental-clinic-website` |
| Framework Preset | Next.js (detected) |
| Build Command | leave default, the `build` script already runs `prisma generate` |

Or from the command line:

```bash
cd dental-clinic-website
vercel login
vercel link
vercel --prod
```

## 2. Add a database

Vercel dashboard, **Storage** tab, create a Postgres database and attach it to
the project. That sets `DATABASE_URL` automatically.

Any PostgreSQL will do. If your provider gives both a direct and a pooled
connection string, use the **pooled** one, because serverless functions open
many short-lived connections.

## 3. Set the environment variables

Project **Settings**, **Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | set for you if you used the Storage tab |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app`, no trailing slash |
| `ADMIN_PASSWORD` | the staff diary password |
| `ADMIN_SESSION_SECRET` | `openssl rand -base64 48` |
| `DEMO_NOINDEX` | `true` while this is a demo. See the warning below. |

`NEXT_PUBLIC_SITE_URL` matters more than it looks: canonical URLs, Open Graph
tags and the sitemap all derive from it.

## 4. Create the tables and seed the diary

The build does not run migrations, deliberately: a build should not be able to
alter a database. Run them once, pointing at the deployed database.

```bash
cd dental-clinic-website
vercel env pull .env          # pulls DATABASE_URL and the rest
npm run db:deploy             # applies both migrations
npm run db:seed               # three dentists, nine services, a realistic diary
```

`db:seed` clears and rebuilds the practice data. Do not run it against a
database holding real patient appointments.

## 5. Check it

```
https://your-project.vercel.app/            hero availability card shows real times
https://your-project.vercel.app/book        full booking journey
https://your-project.vercel.app/admin       staff diary, ADMIN_PASSWORD
https://your-project.vercel.app/robots.txt  should disallow everything while DEMO_NOINDEX=true
```

If the home page loads but shows no appointment times, the database has not
been seeded. If pages error, check the function logs: a missing `DATABASE_URL`
fails with a message saying exactly that.

---

## Before you send the link to a client

> **Set `DEMO_NOINDEX=true`.**
>
> The site presents, correctly, as a real dental practice. The telephone
> number, WhatsApp number, email address and street address in
> `data/clinic.ts` are placeholders. If a deployment of it gets indexed, a
> plausible but wrong phone number ends up in front of people searching for a
> dentist in Durban. The variable adds a `noindex, nofollow` header site wide
> and makes `robots.txt` disallow everything. Vercel preview deployments get
> this automatically; production deployments do not, so set it explicitly.

Also worth knowing before anyone looks at it:

- **The three dentists are invented**, with photographs from Unsplash. Their
  biographies deliberately list no qualifications or registration numbers.
- **Fees are indicative** South African rates, not the practice's schedule.
- **The legal pages have not been reviewed by a lawyer.** They describe
  accurately what the application does, which is the only honest basis for a
  privacy notice, but that is not the same as being signed off.
- **Nothing is empty on purpose except social proof.** Testimonials, the
  review summary and before-and-after cases are empty arrays and their
  sections render nothing, so there is no invented review or patient case
  anywhere on the site.

The full list is under "Before you launch" in
[`dental-clinic-website/README.md`](dental-clinic-website/README.md).

---

## What works without any third-party account

Nothing needs a payment gateway, a mail provider or a calendar integration.
Each sits behind an interface with a working default, so the complete booking
flow works on a fresh deployment with only the four environment variables
above:

| Capability | Default behaviour |
|---|---|
| Payments | Deposits are settled at the practice and marked received by staff in the diary. No card fields exist anywhere in the codebase. |
| Calendar | Appointments download as an `.ics` file, which Google Calendar, Outlook and Apple Calendar all import. |
| Notifications | Written to the function logs, so you can see what would have been sent. |
| Map | Drawn in-house, with plain links out to Google Maps and Apple Maps. No API key. |

Where to plug real ones in is documented in
`dental-clinic-website/lib/providers/registry.ts`.

---

## One thing to do before real traffic

The `appointment_no_overlap` exclusion constraint in migration
`20261005120100` makes double booking impossible at the database level, which
is what makes this safe across multiple serverless instances. Confirm it
applied:

```bash
cd dental-clinic-website
npx prisma db execute --stdin <<'SQL'
SELECT conname FROM pg_constraint WHERE conname = 'appointment_no_overlap';
SQL
```

It needs the `btree_gist` extension, which the migration creates. If your
provider does not allow extensions, the alternative is a PostgreSQL advisory
lock keyed on dentist plus day at the top of the booking transaction. Both are
explained in the application README.

The booking, lookup and staff sign-in endpoints have **no rate limiting**. Put
something in front of them before real traffic.

---

# Deploying The Apple Bros

The same shape as above. Import the repository as a second Vercel project and
set the Root Directory to `apple-bros-store`.

## Environment variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | set for you if you add a database from the Storage tab |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app`, no trailing slash |
| `ADMIN_PASSWORD` | the staff area password |
| `SESSION_SECRET` | a long random value. `openssl rand -hex 32` |
| `DEMO_NOINDEX` | `true` until the real prices and contact details are in |

Note the name: this one is `SESSION_SECRET`, where the dental build uses
`ADMIN_SESSION_SECRET`. They are separate applications with separate cookies.

## Create the tables and seed the shop

```bash
cd apple-bros-store
vercel env pull .env
npm run setup            # migrate, generate the client, seed the shop
```

`setup` clears and rebuilds the catalogue. Do not run it against a database
holding real orders.

## Check it

```
https://your-project.vercel.app/              hero shows a real lowest price
https://your-project.vercel.app/shop          the grid, with filters in the URL
https://your-project.vercel.app/trade-in      the figure updates as you answer
https://your-project.vercel.app/order         order tracking
https://your-project.vercel.app/admin         staff area, ADMIN_PASSWORD
https://your-project.vercel.app/robots.txt    disallows everything while DEMO_NOINDEX=true
```

If the home page loads but the grid is empty, the database has not been
seeded.

## What works without any third-party account

**Checkout completes with no payment gateway configured.** An order is placed
as EFT or payment on collection, which is a real way to trade in South Africa
and needs no integration. There is no card form anywhere in the codebase.

| Capability | Default behaviour |
|---|---|
| Payments | EFT against the order reference, or card at the counter on collection. The order holds its stock either way. |
| Notifications | Written to the function logs. Everything the customer needs is also on the confirmation page, so nothing important exists only in an email. |
| Banking details | Printed on the confirmation when the `EFT_*` variables are set. Without them the page says the details will follow, rather than showing an empty block. |

Adding Yoco, PayFast, Peach or Ozow means writing one implementation of the
`PaymentProvider` interface in `lib/providers/payment/types.ts`. The notes in
`lib/providers/payment/index.ts` cover the specific thing that catches people
out with each of the four.

## Before you send the link to a client

> **Set `DEMO_NOINDEX=true`.**
>
> The site presents, correctly, as a real shop. The telephone number, WhatsApp
> number, email and street address in `data/store.ts` are placeholders, and
> the catalogue prices are realistic South African pricing rather than a real
> shop's pricing. Indexed, those put a wrong number and wrong prices in front
> of people shopping for a phone.

Also worth knowing before anyone looks at it:

- **Every photograph is a stock image** from Unsplash, listed in
  `data/images.ts`. Swapping in the shop's own product shots is a single-file
  change.
- **There are no reviews, ratings or testimonials anywhere**, because there
  are none to publish. No component renders them and there is no
  `aggregateRating` in the structured data.
- **The legal pages have not been reviewed by a lawyer.** They are drafted
  against the Consumer Protection Act and POPIA and describe accurately what
  the application does, which is the only honest basis for a privacy notice,
  but that is not the same as being signed off.
- **The independence notice is deliberate and should stay.** The shop sells
  Apple devices and is not Apple, and that is stated in the footer, on the
  about page, in the metadata and in the structured data.

The full list is under "Before this goes live" in
[`apple-bros-store/README.md`](apple-bros-store/README.md).

## One thing to confirm before real traffic

The `CHECK` constraints in migration `20261006120100` are what make negative
stock impossible at the database level, which is what makes the shop safe
across multiple serverless instances. Confirm they applied:

```bash
cd apple-bros-store
npx prisma db execute --stdin <<'SQL'
SELECT conname FROM pg_constraint WHERE conname LIKE 'variant_%' OR conname LIKE 'order_%';
SQL
```

Then run the database-backed order tests against a scratch database on the
same engine. They truncate every table they touch, so do not point them at the
production one:

```bash
DATABASE_URL="postgresql://.../scratch" npm run db:deploy
DATABASE_URL="postgresql://.../scratch" npm run test:db
```

The order, lookup and staff sign-in endpoints have **no rate limiting**. Put
something in front of them before real traffic.
