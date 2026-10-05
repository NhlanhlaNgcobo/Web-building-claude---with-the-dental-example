#!/usr/bin/env node
/**
 * Accessibility audit against the rendered HTML.
 *
 * Deliberately checks the server output rather than the source, because what
 * matters is what reaches the browser. It covers the failure modes that are
 * both common and easy to check without a headless browser:
 *
 *   - images without an alt attribute
 *   - buttons and links with no accessible name
 *   - form controls with no associated label
 *   - duplicate ids, which break every aria reference pointing at them
 *   - skipped heading levels, and pages with no h1 or more than one
 *   - a missing lang attribute
 *
 * Contrast, focus order and live region behaviour still need a real browser
 * and a person. This catches the things that should never need a person.
 *
 * Usage: node scripts/audit-a11y.mjs [baseUrl]
 *
 * Set AUDIT_COOKIE to a staff session cookie to include the diary pages, which
 * are behind authentication:
 *   AUDIT_COOKIE="hds_staff=..." node scripts/audit-a11y.mjs
 */

const BASE = process.argv[2] ?? 'http://localhost:3000';
const COOKIE = process.env.AUDIT_COOKIE ?? '';

const PAGES = [
  '/',
  '/treatments',
  '/treatments/teeth-whitening',
  '/emergency',
  '/about',
  '/team/dr-anika-naidoo',
  '/pricing',
  '/shop',
  '/shop/home-whitening-kit',
  '/basket',
  '/contact',
  '/book',
  '/appointment',
  '/areas/umhlanga',
  '/legal/privacy',
  // Included only when AUDIT_COOKIE is set, since they require a session.
  ...(COOKIE ? ['/admin', '/admin/calendar', '/admin/schedules', '/admin/orders'] : []),
];

/** Strip tags to get the text content of a fragment. */
function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function attr(tag, name) {
  const match = tag.match(
    new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'),
  );
  return match ? (match[2] ?? match[3] ?? '') : null;
}

const problems = [];

function report(page, rule, detail) {
  problems.push({ page, rule, detail: detail.slice(0, 150) });
}

async function auditPage(path) {
  const response = await fetch(`${BASE}${path}`, {
    headers: COOKIE ? { cookie: COOKIE } : {},
    redirect: 'manual',
  });
  if (!response.ok) {
    report(path, 'page did not load', `status ${response.status}`);
    return;
  }
  const html = await response.text();

  /* ---- lang ---- */
  const htmlTag = html.match(/<html[^>]*>/i)?.[0] ?? '';
  if (!attr(htmlTag, 'lang')) report(path, 'missing lang on <html>', htmlTag);

  /* ---- images ---- */
  for (const tag of html.match(/<img[^>]*>/gi) ?? []) {
    if (attr(tag, 'alt') === null) report(path, 'img without alt', tag);
  }

  /* ---- duplicate ids ---- */
  const ids = new Map();
  for (const match of html.matchAll(/\sid\s*=\s*"([^"]+)"/gi)) {
    const id = match[1];
    ids.set(id, (ids.get(id) ?? 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) report(path, 'duplicate id', `${id} appears ${count} times`);
  }

  /* ---- buttons and links need an accessible name ---- */
  for (const [, openTag, inner] of html.matchAll(
    /(<button[^>]*>)([\s\S]*?)<\/button>/gi,
  )) {
    const named =
      attr(openTag, 'aria-label') ||
      attr(openTag, 'aria-labelledby') ||
      attr(openTag, 'title') ||
      textOf(inner).length > 0 ||
      /aria-hidden\s*=\s*"true"/i.test(openTag);
    if (!named) report(path, 'button with no accessible name', openTag);
  }

  for (const [, openTag, inner] of html.matchAll(
    /(<a\s[^>]*href[^>]*>)([\s\S]*?)<\/a>/gi,
  )) {
    const named =
      attr(openTag, 'aria-label') ||
      attr(openTag, 'aria-labelledby') ||
      attr(openTag, 'title') ||
      textOf(inner).length > 0;
    if (!named) report(path, 'link with no accessible name', openTag);
    const text = textOf(inner).toLowerCase();
    if (['click here', 'here', 'read more', 'link'].includes(text)) {
      report(path, 'uninformative link text', text);
    }
  }

  /* ---- form controls need a label ---- */
  const labelFor = new Set(
    [...html.matchAll(/<label[^>]*\sfor\s*=\s*"([^"]+)"/gi)].map((m) => m[1]),
  );

  /**
   * Label open and close positions, so "is this control inside a label" can be
   * answered exactly rather than by looking at a fixed window of preceding
   * characters. A control wrapped in its own label is correctly associated
   * with it, and a long className between the two is not a failure.
   */
  const labelEvents = [
    ...[...html.matchAll(/<label[\s>]/gi)].map((m) => ({
      at: m.index,
      open: true,
    })),
    ...[...html.matchAll(/<\/label>/gi)].map((m) => ({
      at: m.index,
      open: false,
    })),
  ].sort((a, b) => a.at - b.at);

  function insideLabel(position) {
    let depth = 0;
    for (const event of labelEvents) {
      if (event.at >= position) break;
      depth += event.open ? 1 : -1;
    }
    return depth > 0;
  }

  // matchAll rather than match, so each control is located by its own position
  // instead of indexOf finding the first identical tag every time.
  for (const match of html.matchAll(/<(input|select|textarea)[^>]*>/gi)) {
    const tag = match[0];
    const type = (attr(tag, 'type') ?? '').toLowerCase();
    if (['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) continue;

    const id = attr(tag, 'id');
    const labelled =
      attr(tag, 'aria-label') ||
      attr(tag, 'aria-labelledby') ||
      (id && labelFor.has(id)) ||
      insideLabel(match.index);

    if (!labelled) report(path, 'form control with no label', tag);
  }

  /* ---- headings ---- */
  const headings = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)].map(
    (m) => ({ level: Number(m[1]), text: textOf(m[2]) }),
  );
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0) report(path, 'no h1 on the page', '');
  if (h1s.length > 1) {
    report(path, 'more than one h1', h1s.map((h) => h.text).join(' | '));
  }
  let previous = 0;
  for (const heading of headings) {
    if (previous !== 0 && heading.level > previous + 1) {
      report(
        path,
        'skipped heading level',
        `h${previous} jumps to h${heading.level}: ${heading.text}`,
      );
    }
    previous = heading.level;
  }

  /* ---- a main landmark and a skip link ---- */
  if (!/<main[\s>]/i.test(html)) report(path, 'no <main> landmark', '');
  if (!/href="#main"/i.test(html)) report(path, 'no skip link', '');
}

for (const page of PAGES) {
  try {
    await auditPage(page);
    process.stdout.write('.');
  } catch (error) {
    report(page, 'audit threw', String(error));
    process.stdout.write('x');
  }
}

console.log('\n');

if (problems.length === 0) {
  console.log(`Accessibility audit passed across ${PAGES.length} pages.`);
  process.exit(0);
}

const byRule = new Map();
for (const problem of problems) {
  const list = byRule.get(problem.rule) ?? [];
  list.push(problem);
  byRule.set(problem.rule, list);
}

console.error(`Accessibility audit found ${problems.length} problem(s):\n`);
for (const [rule, list] of byRule) {
  console.error(`  ${rule} (${list.length})`);
  for (const problem of list.slice(0, 6)) {
    console.error(`    ${problem.page}  ${problem.detail}`);
  }
  if (list.length > 6) console.error(`    ... and ${list.length - 6} more`);
  console.error('');
}
process.exit(1);
