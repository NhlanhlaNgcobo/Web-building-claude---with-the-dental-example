import { prisma } from '@/lib/db';
import { appointmentIdForToken } from '@/lib/booking/service';
import { fail, ok } from '@/lib/api/respond';

/**
 * The appointment type a booking is for.
 *
 * Needed by the reschedule calendar, which has to compute availability for the
 * same service and duration as the original booking. Returns only the slug,
 * name and duration, and only to a holder of a valid management token.
 */
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  const { reference } = await context.params;
  const token = new URL(request.url).searchParams.get('token') ?? '';

  const appointmentId = await appointmentIdForToken(reference, token);
  if (!appointmentId) {
    return fail('NOT_FOUND', 'No booking found with those details.', 404);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      service: {
        select: { slug: true, name: true, durationMinutes: true },
      },
    },
  });

  if (!appointment) {
    return fail('NOT_FOUND', 'No booking found with those details.', 404);
  }

  return ok(appointment.service);
}
