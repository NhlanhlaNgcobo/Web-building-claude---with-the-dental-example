# Web building with Claude

Three separate things live in this repository: two complete applications and
the Claude Code skills that shaped how they were written. The two applications
are unrelated to each other beyond having been built in the same session.

```
.
├── dental-clinic-website/     BUILD ONE
│   │                          A dental practice website and appointment
│   │                          system. Availability is calculated from a real
│   │                          diary and double booking is prevented
│   │                          transactionally and at the database level.
│   └── README.md              ← start here to run it
│
├── apple-bros-store/          BUILD TWO
│   │                          An ecommerce site for an independent retailer
│   │                          of refurbished Apple devices. Catalogue,
│   │                          variant picker, basket, checkout, trade in
│   │                          calculator, order tracking and a staff area.
│   └── README.md              ← start here to run it
│
└── .claude/skills/            THE SKILLS
    │                          These shape how code gets written. They are not
    │                          part of either application and neither ships
    │                          with them.
    └── README.md              ← what each one does
```

Nothing in `.claude/skills/` is imported, bundled or deployed by either
application, and neither application depends on a skill being present.

---

## Build one: Harbour Dental Studio

A website and booking system for a premium dental practice in Durban,
KwaZulu-Natal. The appointment system is the centre of it rather than a
contact form: availability is computed from clinic hours, per-dentist
schedules, lunch breaks, leave and existing appointments, and two people can
never confirm the same slot.

```bash
cd dental-clinic-website
npm install
cp .env.example .env     # set DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET
npm run setup            # migrate, generate the client, seed a realistic diary
npm run dev
```

The availability engine, the double booking strategy and a pre-launch
checklist are in
[`dental-clinic-website/README.md`](dental-clinic-website/README.md).

## Build two: The Apple Bros

An ecommerce site for an independent South African retailer of refurbished and
new Apple devices. Most stock is a single unit, so the hard problem here is the
mirror image of the dental one: never selling the same device twice.

```bash
cd apple-bros-store
npm install
cp .env.example .env     # set DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
npm run setup            # migrate, generate the client, seed the shop
npm run dev
```

Checkout completes with no payment gateway configured, as EFT or payment on
collection, behind a `PaymentProvider` interface with documented slots for
Yoco, PayFast, Peach and Ozow. Details, and a pre-launch checklist, are in
[`apple-bros-store/README.md`](apple-bros-store/README.md).

### The shared problem

Both applications are built around one question: what stops two people being
promised the same thing? The answer has the same shape in each, which is why
they are worth reading together.

| | Dental | Apple Bros |
|---|---|---|
| The scarce thing | A dentist at a time | A device on a shelf |
| Shown honestly | Slots computed from the real diary | Prices only for variants in stock |
| Committed atomically | Transactional re-check before insert | Conditional `UPDATE ... WHERE quantity >= n` |
| Guaranteed by the database | `EXCLUDE USING gist` on overlapping time ranges | `CHECK (stockQuantity >= 0)` |
| Proven by | Concurrent booking tests | Concurrent order tests |

In both, the application-level check is a courtesy that produces a good error
message, and the database constraint is the thing that actually makes the bad
state impossible.

---

## Deploying

See [`DEPLOYING.md`](DEPLOYING.md). Both need a PostgreSQL database; SQLite
will not work on a serverless platform because the filesystem is ephemeral.

> **If you deploy either of these to show someone, set `DEMO_NOINDEX=true`.**
>
> Both present, correctly, as real businesses, but the contact details are
> placeholders and the Apple Bros prices are not a real shop's prices. That
> variable adds a `noindex` header and a disallow-all `robots.txt`, so a
> plausible but wrong telephone number or price cannot end up in search
> results. Vercel preview deployments get this automatically.

---

## The skills

Three were written to constrain UI work, and are the reason both applications
look and behave the way they do:

| Skill | What it enforces |
|---|---|
| `baseline-ui` | Spacing, hierarchy, typography, a fixed z-index scale, no gradients, accessible primitives rather than hand-rolled behaviour |
| `fixing-accessibility` | Accessible names, keyboard access, focus management, form error association |
| `fixing-motion-performance` | Compositor-only animation, no scroll-driven work, no animated blur on large surfaces |

The other ten are Prisma's own documentation skills, installed automatically by
`prisma init`. They are vendored reference material rather than authored work.

Several of these rules conflicted with a literal reading of each brief, and the
conflicts and their resolutions are documented in each application's README and
in comments at the point of each decision. For example: both navigations apply
`backdrop-filter` once and never transition it, because animating a blur across
the viewport is the most expensive thing a page can do.
