# Claude Code skills

Skills shape how code gets written. They are instructions loaded into a
session, not libraries. **Nothing here is part of the application in
`dental-clinic-website/`**: it imports none of this, bundles none of it, and
runs without any of it present.

They live at `.claude/skills/` because that is where Claude Code looks for
them, relative to the directory it is started in. Run Claude Code from the
repository root and all of these are available.

---

## Authored for this work

These three constrain UI work, and are the reason the dental site looks and
behaves the way it does.

### `baseline-ui`
An opinionated UI baseline. Tailwind defaults unless a custom value is
explicitly requested, accessible component primitives rather than hand-rolled
keyboard behaviour, a fixed z-index scale with no arbitrary values, `h-dvh`
rather than `h-screen`, safe-area insets on fixed elements, compositor-only
animation capped at 200ms for interaction feedback, `text-balance` on headings
and `tabular-nums` on data, no gradients, and one accent colour per view.

### `fixing-accessibility`
Ordered by impact: accessible names first, then keyboard access, then focus
and dialog behaviour, then semantics, then forms and error association. Insists
on native elements before ARIA, and on established primitives for anything
complex such as a dialog or a combobox.

### `fixing-motion-performance`
Animation performance. Never interleave layout reads and writes, never drive
animation from scroll position, prefer `transform` and `opacity`, keep blur
small and never animate it on a large surface, use `IntersectionObserver` for
visibility. Asks that any non-default choice states the constraint justifying
it.

---

## Vendored from Prisma

The ten `prisma-*` skills are Prisma's own documentation, installed
automatically by `prisma init` and recorded in `skills-lock.json`. They are
reference material rather than authored work, and are committed here so the
repository is self-contained.

`prisma-cli`, `prisma-client-api`, `prisma-compute`,
`prisma-database-setup`, `prisma-driver-adapter-implementation`,
`prisma-mongodb-upgrade`, `prisma-orm-setup`, `prisma-postgres`,
`prisma-postgres-setup`, `prisma-upgrade-v7`.

`prisma init` also mirrors these into `.agents/skills/` and
`.windsurf/skills/` for other editors. Those mirrors are gitignored, since
they would be duplicates of what is already here.

---

## Where the rules show up in the build

Several of these constraints conflicted with a literal reading of the brief.
The resolutions are documented at the point of each decision rather than only
here, so they survive someone reading the code without reading this file.

| Conflict | Resolution | Where |
|---|---|---|
| Navigation should fade from transparent glass to frosted, but blur must never be animated on a large surface | `backdrop-filter` is set once and never transitioned. Only `background-color`, `border-color` and `box-shadow` cross-fade. | `components/layout/Nav.tsx` |
| Scroll-triggered nav and section reveals, but nothing may be driven by scroll events | A one pixel `IntersectionObserver` sentinel for the nav, and a reveal hook that disconnects after firing once | `components/layout/Nav.tsx`, `components/ui/Reveal.tsx` |
| Brief asked for 150 to 400ms, skill caps interaction feedback at 200ms | Split by purpose: feedback 200ms, one-shot entrances 300ms, both as theme tokens | `app/globals.css` |
| Brief asked for a custom accessible calendar, skill forbids hand-rolling keyboard behaviour | `react-day-picker` for the grid and keyboard handling, styled entirely custom | `components/booking/AvailabilityCalendar.tsx` |
| No gradients, but blocked time needs a non-colour indicator | One diagonal hatch, on a small static element, justified in a comment | `components/admin/DiaryCalendar.tsx` |
| No `setState` in an effect, but the basket lives in `localStorage` | `useSyncExternalStore`, which is the correct primitive for state outside React and gives cross-tab sync for free | `hooks/useBasket.tsx` |

Two mechanical checks enforce the editorial rules that cannot be left to
review, both in `dental-clinic-website/scripts/`:

- `check-copy.mjs` fails on em dashes, en dashes, and wording that would
  present the site as anything other than a real practice.
- `audit-a11y.mjs` parses the rendered HTML of 19 pages and fails on missing
  alt text, unnamed controls, unlabelled inputs, duplicate ids and skipped
  heading levels.
