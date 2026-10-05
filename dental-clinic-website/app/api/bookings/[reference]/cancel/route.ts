import { z } from 'zod';
import {
  appointmentIdForToken,
  cancelBooking,
} from '@/lib/booking/service';
import { handleError, fail, ok, parseJson } from '@/lib/api/respond';

/**
 * Cancel an appointment.
 *
 * Requires a management token, which is bound to one appointment id, so a
 * token issued for booking A cannot cancel booking B. The token check happens
 * before anything else is read.
 *
 * Cancelling is what returns the slot to availability. The row is not deleted:
 * the status changes, every availability query filters cancelled rows out, and
 * the record survives for the audit trail.
 */
export const dynamic = 'force-dynamic';

const Body = z.object({
  token: z.string().min(20),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  const { reference } = await context.params;
  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  try {
    const appointmentId = await appointmentIdForToken(
      reference,
      parsed.data.token,
    );
    if (!appointmentId) {
      return fail(
        'NOT_FOUND',
        'We could not verify that booking. Please look it up again.',
        404,
      );
    }

    await cancelBooking({
      appointmentId,
      actor: 'patient',
      reason: parsed.data.reason,
    });

    return ok({ reference, status: 'cancelled' });
  } catch (error) {
    return handleError(error);
  }
}
