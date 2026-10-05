import { z } from 'zod';
import { normalizeReference } from '@/lib/booking/reference';
import { SLOT_GRANULARITY_MINUTES } from '@/lib/availability/tz';

/**
 * Shared validation primitives.
 *
 * Every value that crosses a trust boundary is parsed through one of these, so
 * the rules live in exactly one place rather than being re-implemented per
 * route handler.
 */

/* ------------------------------------------------------------------ */
/* South African telephone numbers                                     */
/* ------------------------------------------------------------------ */

/**
 * Normalise a South African number to E.164.
 *
 * Accepts the forms people actually type: 082 123 4567, 0821234567,
 * +27 82 123 4567, 27821234567, and the same with dashes or brackets.
 */
export function toE164ZA(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');

  if (digits.startsWith('+27')) return `+27${digits.slice(3)}`;
  if (digits.startsWith('27') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('0')) return `+27${digits.slice(1)}`;
  if (digits.startsWith('+')) return digits;
  return `+27${digits}`;
}

/** Mobile prefixes in South Africa fall in the 06, 07 and 08 ranges. */
const ZA_MOBILE = /^\+27[6-8]\d{8}$/;

/** Landline and mobile together, for the general enquiry form. */
const ZA_ANY_PHONE = /^\+27[1-8]\d{8}$/;

export const zMobileZA = z
  .string()
  .trim()
  .min(1, 'Enter your mobile number')
  .transform(toE164ZA)
  .refine((v) => ZA_MOBILE.test(v), {
    message: 'Enter a valid South African mobile number, for example 082 123 4567',
  });

export const zPhoneZA = z
  .string()
  .trim()
  .min(1, 'Enter a contact number')
  .transform(toE164ZA)
  .refine((v) => ZA_ANY_PHONE.test(v), {
    message: 'Enter a valid South African telephone number',
  });

/** '+27821234567' displayed as '082 123 4567'. */
export function formatZaPhone(e164: string): string {
  const m = /^\+27(\d{2})(\d{3})(\d{4})$/.exec(e164);
  if (!m) return e164;
  return `0${m[1]} ${m[2]} ${m[3]}`;
}

/* ------------------------------------------------------------------ */
/* Other primitives                                                    */
/* ------------------------------------------------------------------ */

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export const zEmail = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .max(254)
  .email('Enter a valid email address');

/** A local calendar date, validated as a real date and not just the shape. */
export const zLocalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD form')
  .refine((value) => {
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y!, m! - 1, d!));
    return (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m! - 1 &&
      date.getUTCDate() === d
    );
  }, 'That is not a valid date');

/** Minutes from local midnight, constrained to the slot grid. */
export const zLocalMinutes = z.coerce
  .number()
  .int()
  .min(0)
  .max(1439)
  .refine((v) => v % SLOT_GRANULARITY_MINUTES === 0, {
    message: `Appointment times must fall on the ${SLOT_GRANULARITY_MINUTES} minute grid`,
  });

export const zId = z.string().trim().min(1).max(64);

export const zDentistSelection = z.union([zId, z.literal('any')]);

export const zReference = z
  .string()
  .trim()
  .min(6, 'Enter your booking reference')
  .max(24)
  .transform(normalizeReference);

export const zName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${label}`)
    .max(60, `${label} is too long`)
    // Deliberately permissive: South African names legitimately contain
    // spaces, hyphens and apostrophes.
    .regex(/^[\p{L}\p{M}' -]+$/u, `Enter a valid ${label}`);

export const zOptionalNote = z
  .string()
  .trim()
  .max(1000, 'Please keep your note under 1000 characters')
  .optional()
  .or(z.literal('').transform(() => undefined));

/* ------------------------------------------------------------------ */
/* Patient details                                                     */
/* ------------------------------------------------------------------ */

/**
 * The information collected at booking, and no more.
 *
 * POPIA requires that collection is limited to what is necessary for the stated
 * purpose. Booking an appointment needs a name, a way to reach the patient, and
 * whether they have been here before. Medical history, identity numbers and
 * medical aid details are taken at the appointment, in person, where they are
 * actually needed and can be discussed.
 */
export const zPatientDetails = z.object({
  firstName: zName('first name'),
  lastName: zName('surname'),
  email: zEmail,
  mobile: zMobileZA,
  isExistingPatient: z.boolean().default(false),
  notes: zOptionalNote,
  consentToContact: z.literal(true, {
    message: 'Please confirm we may contact you about this appointment',
  }),
});

export type PatientDetailsInput = z.infer<typeof zPatientDetails>;
