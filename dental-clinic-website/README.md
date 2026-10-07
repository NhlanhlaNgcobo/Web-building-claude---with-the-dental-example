# Harbour Dental Studio

A complete website and appointment system for a private dental practice in
Durban, KwaZulu-Natal. The booking engine is the centre of the product rather
than a form bolted onto a brochure: availability is calculated from the real
diary, double booking is prevented transactionally, and the staff diary and the
public site are driven by the same data.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4 and Prisma on
SQLite.

---

## Getting started

Requires Node.js 20.9 or newer. Node 24 is what this was developed against.

```bash
npm install

# better-sqlite3 is a native module and npm 11 blocks install scripts by
# default. This builds its binding, which the database needs in order to work.
npm approve-scripts better-sqlite3
npm rebuild better-sqlite3

cp .env.example .env     # then edit ADMIN_PASSWORD and ADMIN_SESSION_SECRET

npm run setup            # migrate, generate the client, and seed
npm run dev
```

Open http://localhost:3000. The staff diary is at `/admin`, using the
`ADMIN_PASSWORD` from your `.env`.

`npm run setup` seeds a realistic practice: three dentists on different weekly
patterns, nine bookable appointment types, fifteen treatments, nine products,
around 110 appointments spread over the next three weeks, a week of leave, a
training afternoon and a clinic-wide maintenance morning. Today is left
comparatively open so there is same-day availability to look at.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build, which fails on a type error |
| `npm run verify` | Copy check, typecheck, lint and tests |
| `npm test` | 92 tests, mostly on the availability engine |
| `npm run audit:a11y` | Accessibility audit against the rendered HTML, needs the dev server running |
| `npm run check:copy` | Fails on em dashes, en dashes and non-practice wording |
| `npm run db:reset` | Drop and recreate the database |
| `npm run db:seed` | Reseed |
| `npm run db:studio` | Browse the database |
| `npm run db:cleanup` | Remove data left behind by manual testing |

---

## How availability works

This is the part worth understanding before changing anything.

### The engine is a pure function

`lib/availability/compute.ts` exports `computeSlots(input)`. It imports no
Prisma, constructs no `Date`, and calls nothing asynchronous. It takes already
loaded data as plain integers and returns the slots.

That split is deliberate and it is what makes the rules testable. All timezone
work happens at the boundary in `lib/availability/tz.ts`, and all database work
in `lib/availability/loader.ts`.

Recurring facts (clinic hours, dentist rosters, lunch breaks) are stored as
**minutes from local midnight**, because a recurring "08:00" is a wall clock
fact rather than a point in time. Concrete occurrences (appointments, blocked
periods) are stored as **UTC instants**. The clinic timezone is
`Africa/Johannesburg`, a constant UTC+2 with no daylight saving.

### A slot is offered only if all of this holds

| Rule | Where |
|---|---|
| The clinic is open that weekday | `ClinicHours`, Sunday is closed |
| A dentist eligible for that appointment type is rostered | `DentistSchedule` and `ServiceDentist` |
| The whole reserved interval fits inside their working window | Rule A in `compute.ts` |
| It overlaps no appointment, lunch break or blocked period | Rule B |
| It is at or after now plus the minimum lead time, on today only | Rule C |
| The date has not already passed | the `dayPosition` gate |

The reserved interval is the appointment duration **plus** any turnaround
buffer on the service. The patient is shown the chair time; the diary holds
the buffered time.

### The overlap rule

One predicate, in `lib/availability/overlap.ts`, used by slot listing, by
server-side validation and by the staff diary, so they cannot disagree:

```
overlaps(a, b)  ===  a.start < b.end && b.start < a.end
```

Half-open intervals. Touching intervals do **not** overlap, so back-to-back
appointments are legal, which is how a real chair runs. Against an existing
10:00 to 10:45 appointment, a new 30 minute booking is refused at 09:45, 10:00,
10:15 and 10:30, and allowed at 09:30 (which ends exactly at 10:00) and at
10:45. That case is pinned down by tests in `__tests__/availability.test.ts`,
because a `<=` in the wrong place silently breaks it.

### Slot granularity is 15 minutes

Coarser would not work. On a 30 minute grid anchored at 08:00, the times 09:45
and 10:15 never exist as candidates, so the blocking behaviour above could not
even be expressed, and a real 30 minute gap at 10:15 would be invisible.
Fifteen minutes divides every realistic dental duration and keeps a day at
roughly 40 candidates per dentist, which costs nothing to compute.

### One function, four surfaces

`findNextAvailable` powers the hero availability card, the next-appointment
call to action on each treatment page, the emergency earliest-first search and
the empty-day fallback. The forward scan is bounded (it steps forward by a
positive constant with a hard cap), so it cannot run away against a full diary.

An empty day never says "no availability" and stop. It explains which day and
why, distinguishing a closed Sunday from a fully booked Wednesday from a
blocked public holiday, then offers the genuinely next available times.

### Why availability is fetched client-side on marketing pages

The content pages are statically generated, which is what makes them fast. A
server-rendered appointment time on a static page would be frozen at build
time, or at whatever moment a CDN last revalidated it, and would confidently
show a slot that went hours ago.

So the marketing pages are static and their availability widgets fetch
`/api/availability/next` after mount. The booking flow itself is dynamic and
server-rendered, and never cached. Both the pages and the API send `no-store`.

---

## How double booking is prevented

Availability is validated **twice**, and the second check is the one that
counts.

1. When slots are listed, so a patient is only ever shown real options.
2. Again inside a Prisma interactive transaction, immediately before the row is
   inserted.

The date, time and dentist arriving in a booking request are treated as a hint
with no authority. The server recomputes availability from the live diary
inside the transaction, then performs a direct overlap probe against both
appointments and blocked periods. Only then does it insert.

If the slot has gone, it throws `SlotTakenError` carrying **freshly computed
alternatives**, which the API returns and the interface offers immediately. The
patient keeps their details and is one click from a different time.

When "first available dentist" was chosen, each slot carries the other eligible
dentists who were also free at that time, in a deterministic order, and the
transaction falls through to a colleague rather than refusing.

Cancelling is the only thing that returns a slot to availability. `completed`
and `no_show` keep blocking, because the chair time was consumed either way.
Rescheduling releases the original interval and claims the new one in a single
`UPDATE`, so there is no instant at which the appointment holds both or
neither, and the booking reference does not change.

### Moving to PostgreSQL

**Read this before deploying with more than one server process.**

SQLite serialises writes, so the transactional re-check above is genuinely
sufficient in development: two concurrent bookings cannot interleave between
the probe and the insert. A multi-connection PostgreSQL deployment can run them
truly concurrently, which reopens the window.

The fix is a database-level guarantee, so a double booking becomes impossible
rather than merely unlikely:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    "dentistId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE (status <> 'cancelled');
```

Two details matter. The `[)` bound is what keeps a 10:00 to 10:45 appointment
from colliding with a 10:45 start, matching the application predicate exactly.
And the `WHERE status <> 'cancelled'` clause is not optional: without it a
cancelled appointment would permanently poison its own slot.

**Prisma cannot express exclusion constraints**, so this goes in a hand-written
migration with a comment explaining why it is raw SQL. If you cannot install
`btree_gist`, the alternative is a PostgreSQL advisory lock keyed on dentist
plus day, taken at the top of the booking transaction.

The rest of the migration is deliberately boring:

| Change | Detail |
|---|---|
| Provider | `sqlite` to `postgresql` in `prisma/schema.prisma` |
| Driver adapter | `PrismaBetterSqlite3` to `PrismaPg` in `lib/db.ts`, one line |
| Timestamps | Add `@db.Timestamptz(3)` to **every** `DateTime` field. Without it Prisma emits a type with no timezone and silently reinterprets instants. This is the highest-risk item. |
| Migrations | Regenerate. The existing migration SQL is SQLite flavoured and is not portable. |
| Isolation | Pass `isolationLevel: 'Serializable'` to `$transaction`. Prisma throws if you pass it on SQLite, so gate it on the provider. |

Deliberately unchanged, which is most of it: statuses stay `String` columns
backed by TypeScript unions and Zod schemas, money stays integer cents,
recurring times stay integer minutes, ids stay application-generated `cuid()`,
and there are no array columns anywhere to unwind.

---

## Integrations, and what runs without them

**Nothing in this application requires a third-party account.** Every external
capability sits behind an interface with a working local default, so the whole
site including the complete booking flow works with an empty `.env` beyond the
database URL and the staff secrets.

| Capability | Default | Where to add a real one |
|---|---|---|
| Payments | `manual`: deposits settled at the practice, staff mark them received in the diary. No card fields exist anywhere in this codebase. | `lib/providers/payment/`, implement `PaymentProvider`, register it, set `PAYMENT_PROVIDER` |
| Calendar | `local`: appointments download as an `.ics` file, which Google Calendar, Outlook and Apple Calendar all import | `lib/providers/calendar/`, implement `CalendarProvider`, set `CALENDAR_PROVIDER` |
| Notifications | `log`: writes what would be sent to the server log, so staff can see enquiries and confirmations with nothing connected | `lib/providers/notification/`, implement `NotificationProvider`, set `NOTIFICATION_PROVIDER` |
| Analytics | console in development, silent in production | `lib/analytics.ts`, add a sink. A GA4 sink is present and activates when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set |
| Map | drawn in-house, with plain links out to Google Maps and Apple Maps | `components/layout/MapPanel.tsx`, drop a static map image into the frame |

Notes for whoever wires up a South African payment gateway are in
`lib/providers/registry.ts`, next to each commented registry entry: Yoco
amounts are already in cents, PayFast ITN is form encoded and needs signature
plus source IP validation, Peach is a two-step create-then-poll, and Ozow has
no programmatic refund so its adapter should set `supportsRefunds: false`.

### Architecture that exists for later

Declared now so these ship as data plus a scheduled job rather than as a
refactor:

- **Appointment reminders.** `appointment_reminder` is already in the
  notification event union. Index `status, startTime` supports the sweep, and
  an `AppointmentEvent` of type `reminder_sent` gives idempotency.
- **Recall reminders.** `recall_due` is in the union. Index
  `patientId, startTime` supports finding patients whose last completed
  examination is older than the recall interval.
- **Treatment plan follow-up.** `treatment_plan_follow_up` is in the union.
- **Payment plan information.** Treatment pages carry a `supportsPaymentPlan`
  flag and render a block pointing at reception. It deliberately advertises no
  terms, because none are configured.

---

## Project structure

```
app/
  (site)/          public pages, with the shared nav, footer and mobile bar
  admin/           staff diary, dark chrome, its own layout, never indexed
  api/             route handlers, all Zod validated
components/
  booking/         the wizard, calendar, confirmation, manage, emergency search
  admin/           diary grid, appointment drawer, block and roster editors
  services/ shop/ layout/ ui/ brand/ social-proof/
lib/
  availability/    types, overlap, compute (all pure), then tz, loader, service
  booking/         create, cancel, reschedule, references, manage tokens
  providers/       payment, calendar, notification interfaces and defaults
  admin/           session, auth guards, diary queries
data/              clinic config, treatments, services, dentists, products, legal
prisma/            schema, migrations, seed
scripts/           copy check, accessibility audit, test data cleanup
__tests__/         engine unit tests, loader integration tests, collision tests
```

Editorial content lives in `data/` rather than inside components, so the
practice can change copy, fees and photography without touching a component.

---

## Testing

```bash
npm test
```

92 tests. The valuable ones are not the page tests:

- **`availability.test.ts`** exercises the pure engine: the specification
  collision case, five appointment durations, turnaround buffers, lunch, leave,
  split shifts, the Friday and Saturday closes, closed Sundays, past dates,
  lead time, grid anchoring, and the deterministic "any dentist" ordering.
- **`collision.test.ts`** runs against the real database through the real
  transaction. Two concurrent bookings for one slot produce exactly one
  success, the loser receives genuine alternatives, cancelling frees a slot,
  rescheduling releases the original, and a move within an appointment's own
  footprint works (the self-exclusion case, which is the most common
  reschedule there is).
- **`integration.test.ts`** checks that the Prisma loader feeds the engine
  correctly: clinic hours, lunch as a separate interval, service eligibility,
  buffers, and that cancelled appointments are excluded from busy time.

### Checks beyond the test suite

```bash
npm run check:copy      # em dashes, en dashes and non-practice wording
npm run audit:a11y      # needs the dev server running
```

The copy check enforces two editorial rules mechanically, because both creep
back one commit at a time: no em or en dashes anywhere, and no wording that
presents the site as anything other than a real practice.

The accessibility audit parses the rendered HTML of 19 pages and fails on
missing alt text, buttons or links without an accessible name, unlabelled form
controls, duplicate ids, skipped heading levels, a missing `main` landmark or
skip link, and a missing `lang`. To include the staff pages, pass a session
cookie:

```bash
AUDIT_COOKIE="hds_staff=..." npm run audit:a11y
```

Contrast, focus order, screen reader announcement and real device behaviour
still need a person.

---

## Design system

Defined once in `app/globals.css` as Tailwind v4 theme tokens. Components use
token names and never raw hex.

White and off-white carry the content, near black carries weight and contrast,
and a single blue is reserved for action, active state and focus. If something
is blue on this site it is interactive, active, or telling you about
availability. Two greys exist because one cannot pass AA everywhere:
`--color-grey` for body copy and `--color-grey-strong` for small labels.

**Glass** has exactly three variants, so it stays an accent rather than the
default texture: `glass-light`, `glass-dark` and `glass-blue` (reserved for the
deposit panel). Flat white and flat near-black sections sit between them.

`backdrop-filter` is applied once and **never transitioned**. Animating a blur
across a wide surface makes the compositor re-filter every frame, which is the
most expensive thing a page like this could do. The navigation cross-fades
`background-color`, `border-color` and `box-shadow` only.

**Motion** has two duration tokens, split by purpose. Interaction feedback
(hover, press, focus) is capped at 200ms. One-shot entrances use 300ms. Section
reveals are driven by a single `IntersectionObserver` that disconnects after
firing, so nothing runs while the page scrolls, and there are no scroll
listeners anywhere in the project. `prefers-reduced-motion` removes it all.

Accessible behaviour comes from [Base UI](https://base-ui.com) for dialogs,
alert dialogs and accordions, and from `react-day-picker` for the booking
calendar. Keyboard navigation and focus management are not hand-rolled.
Availability is never communicated by colour alone: a bookable day carries a
dot, an unavailable one is struck through, and each carries a full spoken label.

---

## Security

- **No card data.** There is no code path in this application that accepts,
  transmits or stores a card number, which keeps the practice out of PCI scope.
- **Server-side validation on every boundary.** Each route handler parses its
  input with Zod before anything else, and booking availability is recomputed
  server-side regardless of what the client sent.
- **Staff area.** `proxy.ts` blocks unauthenticated requests to `/admin` and
  `/api/admin`, and every page and handler there re-checks the session itself
  rather than trusting the proxy. The session cookie is `httpOnly`, signed with
  HMAC-SHA256 and `secure` in production. Password comparison is constant time.
- **Appointment management.** Cancelling and rescheduling need an HMAC token
  bound to one appointment id, so a token for one booking cannot act on
  another. Looking up a booking requires the reference plus the email address
  or mobile number it was booked with, compared in constant time, and returns
  an **identical** response for a wrong contact detail and a non-existent
  reference, so it cannot be used to discover which references are real.
- **POPIA.** Booking collects a name, a mobile number, an email address and
  whether the patient has been here before. Not an identity number, not medical
  aid details, not medical history: those are taken in person where they are
  needed. See `/legal/privacy`.
- **Forms** use a hidden honeypot field rather than a third-party captcha.
- Secrets come from the environment. `.env` is ignored; `.env.example` is not.

---

## Before you launch

The site is complete and runs, but these are placeholders that must be
replaced with the practice's real details.

1. **Contact details and address.** All in `data/clinic.ts`. The telephone
   number, WhatsApp number, email address, street address and map coordinates
   are invented for development. Replace every field in that one file.
2. **Dentists.** `data/dentists.ts` has three profiles. The biographies
   deliberately list no qualifications, registration numbers or years of
   experience, because none of that should be published without being checked
   against each practitioner's own records. Add real credentials only once
   verified.
3. **Fees.** `data/treatments.ts` carries indicative South African fees. Confirm
   every one against the practice's current schedule.
4. **Photography.** `data/images.ts` holds every image in one file, loaded from
   Unsplash through `next/image`. Replace the URLs with the practice's own
   shoot, keeping the keys and the aspect ratios. Note that remote images need
   network access at request time; if you move the files into `/public`, update
   `remotePatterns` in `next.config.ts`.
5. **Legal wording.** `data/legal.ts` contains a privacy notice, terms, cookie
   policy, patient information and cancellation policy. They describe
   accurately what this application does, which is the only honest basis for a
   privacy notice, but **they are not a substitute for review by a legal
   practitioner.** Have them reviewed before launch.
6. **Secrets.** Set a real `ADMIN_PASSWORD` and generate
   `ADMIN_SESSION_SECRET` with `openssl rand -base64 48`.
7. **`NEXT_PUBLIC_SITE_URL`.** Canonical URLs, Open Graph tags and the sitemap
   all derive from it.
8. **Database.** Follow "Moving to PostgreSQL" above, including the exclusion
   constraint.
9. **Rate limiting.** The booking, lookup and sign-in endpoints have no limiter.
   Put one in front of them.

### What is deliberately empty

`data/social-proof.ts` exports empty arrays for testimonials, review summary
and before-and-after cases. The components that read them render nothing, so
the site ships with no invented review, rating, star count, award or patient
case anywhere on it. Populate them with genuine material when there is some,
and in the case of clinical photographs only with recorded written consent,
which the `BeforeAfterCase` type requires explicitly.

The trust section communicates real, checkable capabilities instead: written
treatment plans, published fees, live online booking, time held back for
urgent care.

---

## Known limitations

- **Deposits are recorded, not charged.** With the default provider a deposit
  is settled at the practice and marked received by a staff member. Connect a
  gateway to take payment online.
- **Notifications are logged, not sent.** Connect a transport.
- **One shared staff password.** Suits a single practice. `lib/admin/session.ts`
  is the single place to swap in per-user accounts.
- **No rate limiting**, as above.
- **The `/areas/[slug]` route ships two pages**, Umhlanga and Morningside, each
  with genuinely distinct travel, parking and landmark content. The
  architecture supports more, but adding pages that differ only by place name
  helps nobody and search engines treat them as what they are.

## Recommended follow ups

Neither of these is a defect. Both are places where a guarantee currently lives
in application code and could be pushed down into the database, which is where
a guarantee is hardest to bypass.

- **A `CHECK` constraint on `Payment`.** Exactly one of `appointmentId` and
  `orderId` must be set, and today only the service layer enforces that. Prisma
  cannot express a `CHECK`, so it needs a hand written migration alongside the
  overlap constraint:

  ```sql
  ALTER TABLE "Payment" ADD CONSTRAINT payment_target_exactly_one
    CHECK (("appointmentId" IS NULL) <> ("orderId" IS NULL));
  ```

  Worth adding before the payments table has real rows in it, because a
  constraint added later will refuse to apply if any existing row violates it.

- **Rate limiting** on the booking, lookup and staff sign-in endpoints, as
  noted above.
