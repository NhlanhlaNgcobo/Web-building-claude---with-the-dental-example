import { randomInt } from 'node:crypto';

/**
 * Order and trade in references.
 *
 * The alphabet excludes I, L, O, U, 0 and 1, which are the characters people
 * confuse when reading a reference over the telephone or copying it off a
 * screen. Six characters from thirty gives about 729 million combinations,
 * and the write retries on the unique constraint regardless.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const LENGTH = 6;

const ORDER_PREFIX = 'AB';
const TRADE_IN_PREFIX = 'AB-T';

function body(): string {
  let out = '';
  for (let i = 0; i < LENGTH; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

export function generateOrderReference(): string {
  return `${ORDER_PREFIX}-${body()}`;
}

export function generateTradeInReference(): string {
  return `${TRADE_IN_PREFIX}-${body()}`;
}

/**
 * Normalise whatever was typed into the stored format.
 *
 * Accepts lower case, missing dashes and stray spaces, because a reference
 * read off a phone screen is rarely typed back perfectly.
 */
export function normalizeReference(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.startsWith('ABT')) return `${TRADE_IN_PREFIX}-${cleaned.slice(3)}`;
  if (cleaned.startsWith('AB')) return `${ORDER_PREFIX}-${cleaned.slice(2)}`;
  return `${ORDER_PREFIX}-${cleaned}`;
}

export function looksLikeOrderReference(input: string): boolean {
  return /^AB-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/.test(
    normalizeReference(input),
  );
}
