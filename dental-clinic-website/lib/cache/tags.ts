import { revalidateTag } from 'next/cache';
import type { LocalDate } from '@/lib/availability/types';

/**
 * Cache tags.
 *
 * Availability itself is never cached: the booking routes are dynamic and send
 * no-store, because the cost of serving a stale diary is showing two patients
 * the same slot. These tags exist for the pages that embed availability inside
 * otherwise cacheable content, such as the hero card and the next-appointment
 * call to action on each treatment page.
 *
 * Every mutation that can change availability calls invalidateAvailability
 * after its transaction commits, which is what makes an admin diary change
 * visible on the public site immediately rather than after a timeout.
 */

export const AVAILABILITY_TAG = 'availability';
export const CATALOGUE_TAG = 'catalogue';

export function dentistAvailabilityTag(dentistId: string): string {
  return `availability:${dentistId}`;
}

export function dayAvailabilityTag(date: LocalDate): string {
  return `availability:date:${date}`;
}

/**
 * Stale availability is never served, not even briefly.
 *
 * Next's recommended profile for revalidateTag is "max", which serves stale
 * content for up to a year while a fresh copy loads in the background. That is
 * right for a product catalogue and wrong for a diary: a patient shown a slot
 * that was taken minutes ago gets as far as the confirmation step before the
 * booking transaction refuses it. `{ expire: 0 }` makes the next request a
 * blocking revalidate instead, which costs a few milliseconds and is the
 * correct trade for this data.
 */
const IMMEDIATE = { expire: 0 } as const;

export function invalidateAvailability(
  scope: {
    readonly dentistIds?: readonly string[];
    readonly dates?: readonly LocalDate[];
  } = {},
): void {
  try {
    revalidateTag(AVAILABILITY_TAG, IMMEDIATE);
    for (const id of scope.dentistIds ?? []) {
      if (id) revalidateTag(dentistAvailabilityTag(id), IMMEDIATE);
    }
    for (const date of scope.dates ?? []) {
      if (date) revalidateTag(dayAvailabilityTag(date), IMMEDIATE);
    }
  } catch {
    // revalidateTag is only callable inside a request or action scope. Calling
    // it from a seed script or a test is not an error worth failing a booking
    // over, and the availability routes are uncached regardless.
  }
}

/**
 * Called when services, dentists or products are edited.
 *
 * Catalogue content changes rarely and tolerates a brief window of staleness,
 * so this one does use the stale-while-revalidate behaviour.
 */
export function invalidateCatalogue(): void {
  try {
    revalidateTag(CATALOGUE_TAG, 'max');
  } catch {
    // See above.
  }
}
