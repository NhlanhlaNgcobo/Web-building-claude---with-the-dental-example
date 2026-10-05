import { z } from 'zod';
import { lookupBooking } from '@/lib/booking/service';
import { handleError, ok, parseJson } from '@/lib/api/respond';
import { zEmail, zMobileZA, zReference } from '@/lib/validation/primitives';

/**
 * Find a booking by reference plus one piece of matching contact detail.
 *
 * POST rather than GET on purpose: the verification value must not end up in
 * a URL, a server access log or the browser's history.
 *
 * The service layer returns an identical "no booking found" for a reference
 * that does not exist and for one where the contact detail does not match, so
 * this endpoint cannot be used to discover which references are real.
 */
export const dynamic = 'force-dynamic';

const Body = z.object({
  reference: zReference,
  verification: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('email'), value: zEmail }),
    z.object({ kind: z.literal('mobile'), value: zMobileZA }),
  ]),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  try {
    const booking = await lookupBooking({
      reference: parsed.data.reference,
      verification: parsed.data.verification,
    });
    return ok(booking);
  } catch (error) {
    return handleError(error);
  }
}
