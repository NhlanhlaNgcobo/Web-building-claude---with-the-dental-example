import { randomInt } from 'node:crypto';

/**
 * Booking references.
 *
 * The alphabet excludes I, L, O, U, 0 and 1, which are the characters people
 * confuse when reading a reference back over the telephone. Six characters from
 * a thirty character alphabet gives about 729 million combinations, which is far
 * more than a single practice will ever need, and the booking transaction
 * retries on the unique constraint anyway.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const LENGTH = 6;

const APPOINTMENT_PREFIX = 'HDS';
const ORDER_PREFIX = 'HDS-O';

function body(): string {
  let out = '';
  for (let i = 0; i < LENGTH; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

export function generateAppointmentReference(): string {
  return `${APPOINTMENT_PREFIX}-${body()}`;
}

export function generateOrderReference(): string {
  return `${ORDER_PREFIX}-${body()}`;
}

/**
 * Normalise whatever the patient typed into the stored format.
 *
 * Accepts lower case, missing dashes and stray spaces, because a reference read
 * off a phone screen is rarely typed back perfectly.
 */
export function normalizeReference(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.startsWith('HDSO')) return `${ORDER_PREFIX}-${cleaned.slice(4)}`;
  if (cleaned.startsWith('HDS')) return `${APPOINTMENT_PREFIX}-${cleaned.slice(3)}`;
  return `${APPOINTMENT_PREFIX}-${cleaned}`;
}

/** Whether a string could plausibly be an appointment reference. */
export function looksLikeReference(input: string): boolean {
  return /^HDS-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/.test(
    normalizeReference(input),
  );
}
