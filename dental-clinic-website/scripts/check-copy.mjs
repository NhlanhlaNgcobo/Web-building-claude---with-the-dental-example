#!/usr/bin/env node
/**
 * Copy guard.
 *
 * Enforces two editorial rules mechanically rather than by eye, because both
 * are the kind of thing that creeps back in one commit at a time:
 *
 *   1. No em dashes or en dashes anywhere in the source. Standard punctuation
 *      only. These are easy to introduce by pasting from a word processor and
 *      invisible in review.
 *
 *   2. No wording that presents the site as anything other than a real
 *      practice. Words like "demo", "mock" and "placeholder" belong in a
 *      README, never in something a patient could read.
 *
 * Run with `npm run check:copy`. Exits non-zero on any hit, so it works in CI.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();

/** Directories scanned. Everything patient-facing plus the content files. */
const SCAN_DIRS = ['app', 'components', 'data', 'lib', 'hooks', 'types'];

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'generated',
  'migrations',
]);

const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.md']);

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

const DASH_RULES = [
  {
    // U+2014
    pattern: /—/g,
    name: 'em dash',
    fix: 'Use a comma, a colon, or two sentences.',
  },
  {
    // U+2013
    pattern: /–/g,
    name: 'en dash',
    fix: 'Use "to" for ranges, for example "08:00 to 17:00".',
  },
];

/**
 * Wording that must never reach the customer-facing UI.
 *
 * Checked against string and template literals only, so a variable named
 * `mockData` in a test helper or the word "example" in a code comment does not
 * trip it. What matters is what could be rendered.
 */
const FORBIDDEN_WORDS = [
  'demo',
  'prototype',
  'mock booking',
  'mock data',
  'simulated',
  'fictional',
  'example website',
  'test environment',
  'lorem ipsum',
  'placeholder text',
  'coming soon',
  'dummy',
  'sample site',
];

/**
 * Deliberate exceptions, with a reason for each.
 * Matched as a substring of the offending line.
 */
const ALLOWED = [
  // Seed data and fixtures legitimately use reserved example domains.
  '@example.co.za',
  'you@example.co.za',
  // The honeypot field name, which is not displayed.
  'honeypot',
];

/* ------------------------------------------------------------------ */
/* Scan                                                                */
/* ------------------------------------------------------------------ */

function walk(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
    } else if (EXTENSIONS.has(entry.slice(entry.lastIndexOf('.')))) {
      files.push(full);
    }
  }
  return files;
}

/** Extract quoted string and template literal contents from a line. */
function literalsIn(line) {
  const out = [];
  const patterns = [/'([^'\\]|\\.)*'/g, /"([^"\\]|\\.)*"/g, /`([^`\\]|\\.)*`/g];
  for (const pattern of patterns) {
    const matches = line.match(pattern);
    if (matches) out.push(...matches);
  }
  return out;
}

const problems = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const relativePath = relative(ROOT, file).split(sep).join('/');
    const lines = readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, index) => {
      if (ALLOWED.some((allowed) => line.includes(allowed))) return;

      // Rule 1: dashes, anywhere in the file.
      for (const rule of DASH_RULES) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(line)) {
          problems.push({
            file: relativePath,
            line: index + 1,
            rule: rule.name,
            detail: line.trim().slice(0, 100),
            fix: rule.fix,
          });
        }
      }

      // Rule 2: forbidden wording, in displayable strings only.
      const literals = literalsIn(line).join(' ').toLowerCase();
      if (literals.length === 0) return;

      for (const word of FORBIDDEN_WORDS) {
        // Word boundaries, so "demo" does not match "democratic" and
        // "dummy" does not match a longer identifier.
        const boundary = new RegExp(`\\b${word.replace(/ /g, '\\s+')}\\b`, 'i');
        if (boundary.test(literals)) {
          problems.push({
            file: relativePath,
            line: index + 1,
            rule: `forbidden wording: "${word}"`,
            detail: line.trim().slice(0, 100),
            fix: 'The public site must read as a real practice. Move this wording to the README.',
          });
        }
      }
    });
  }
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

if (problems.length === 0) {
  console.log('Copy check passed: no em dashes, en dashes or forbidden wording.');
  process.exit(0);
}

console.error(`\nCopy check failed with ${problems.length} problem(s):\n`);

for (const problem of problems) {
  console.error(`  ${problem.file}:${problem.line}`);
  console.error(`    rule: ${problem.rule}`);
  console.error(`    line: ${problem.detail}`);
  console.error(`    fix:  ${problem.fix}\n`);
}

process.exit(1);
