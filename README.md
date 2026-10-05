# Web building with Claude, with the dental example

Two separate things live in this repository. They are not related to each
other beyond having been used in the same session.

```
.
├── dental-clinic-website/     THE BUILD
│   │                          A complete dental practice website and
│   │                          appointment system. This is the application.
│   │                          It has its own README with setup and
│   │                          architecture notes.
│   ├── app/                   Next.js routes, public site and staff diary
│   ├── components/            React components
│   ├── lib/                   Availability engine, booking service, providers
│   ├── data/                  Clinic config and editorial content
│   ├── prisma/                Schema, migrations, seed
│   └── README.md              ← start here to run it
│
└── .claude/skills/            THE SKILLS
    │                          Claude Code skills. These shape how code gets
    │                          written; they are not part of the application
    │                          and none of them ship with it.
    └── README.md              ← what each one does
```

Nothing in `.claude/skills/` is imported, bundled or deployed by the
application. Nothing in `dental-clinic-website/` depends on a skill being
present.

---

## The build

A website and booking system for a fictional premium dental practice in
Durban, KwaZulu-Natal, built as a worked example. The appointment system is
the centre of it rather than a contact form: availability is calculated from
the real diary, double booking is prevented transactionally and at the
database level, and the staff diary and the public site read the same data.

Next.js 16, React 19, TypeScript, Tailwind CSS v4, Prisma, PostgreSQL.

```bash
cd dental-clinic-website
npm install
cp .env.example .env     # set DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET
npm run setup            # migrate, generate the client, seed a realistic diary
npm run dev
```

Full setup instructions, the architecture of the availability engine, the
double booking strategy, and a pre-launch checklist are in
[`dental-clinic-website/README.md`](dental-clinic-website/README.md).

### Deploying

See [`DEPLOYING.md`](DEPLOYING.md). It needs a PostgreSQL database; SQLite will
not work on a serverless platform because the filesystem is ephemeral.

> **If you deploy this to show someone, set `DEMO_NOINDEX=true`.**
>
> The site presents, correctly, as a real dental practice, but the telephone
> number, address and email in `data/clinic.ts` are placeholders. That
> variable adds a `noindex` header and a disallow-all `robots.txt`, so a
> plausible but wrong phone number cannot end up in search results for people
> looking for a dentist in Durban. Vercel preview deployments get this
> automatically.

---

## The skills

Three were written to constrain UI work, and are the reason the application
looks and behaves the way it does:

| Skill | What it enforces |
|---|---|
| `baseline-ui` | Spacing, hierarchy, typography, a fixed z-index scale, no gradients, accessible primitives rather than hand-rolled behaviour |
| `fixing-accessibility` | Accessible names, keyboard access, focus management, form error association |
| `fixing-motion-performance` | Compositor-only animation, no scroll-driven work, no animated blur on large surfaces |

The other ten are Prisma's own documentation skills, installed automatically by
`prisma init`. They are vendored reference material rather than authored work.

Several of these rules conflicted with a literal reading of the brief, and
those conflicts and their resolutions are documented in
[`dental-clinic-website/README.md`](dental-clinic-website/README.md) and in
comments at the point of each decision. For example: the navigation applies
`backdrop-filter` once and never transitions it, because animating a blur
across the viewport is the most expensive thing the page could do.
