import { z } from 'zod';
import {
  appointmentIdForToken,
  rescheduleBooking,
} from '@/lib/booking/service';
import { handleError, fail, ok, parseJson } from '@/lib/api/respond';
import { zLocalDate, zLocalMinutes } from '@/lib/validation/primitives';

/**
 * Move an appointment to a new time.
 *
 * Requires a management token bound to this appointment. A patient may change
 * the time but not the dentist, which is why there is no dentist field here:
 * moving to a different clinician is a conversation with reception rather than
 * a self-service action.
 *
 * The original slot is released and the new one claimed in a single update, so
 * there is no moment at which the appointment holds both or neither, and the
 * booking reference does not change.
 */
export const dynamic = 'force-dynamic';

const Body = z.object({
  token: z.string().min(20),
  date: zLocalDate,
  startMinutes: zLocalMinutes,
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

    const updated = await rescheduleBooking({
      appointmentId,
      date: parsed.data.date,
      startMinutes: parsed.data.startMinutes,
      actor: 'patient',
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
