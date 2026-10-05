import { z } from 'zod';
import { requireStaffApi } from '@/lib/admin/auth';
import {
  markDepositPaid,
  rescheduleBooking,
  setAppointmentStatus,
} from '@/lib/booking/service';
import { prisma } from '@/lib/db';
import { AppointmentStatus } from '@/lib/domain/enums';
import { fail, handleError, ok, parseJson } from '@/lib/api/respond';
import { zLocalDate, zLocalMinutes } from '@/lib/validation/primitives';
import { invalidateAvailability } from '@/lib/cache/tags';
import { todayLocalDate } from '@/lib/availability/tz';

/**
 * Update one appointment from the staff diary.
 *
 * One endpoint with a discriminated action rather than four sibling routes, so
 * the status transition table is enforced in exactly one place and a notes
 * edit can never accidentally move a booking.
 */
export const dynamic = 'force-dynamic';

const Body = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('status'),
    status: AppointmentStatus.schema,
    internalNote: z.string().trim().max(1000).optional(),
  }),
  z.object({
    action: z.literal('move'),
    date: zLocalDate,
    startMinutes: zLocalMinutes,
    dentistId: z.string().trim().min(1).max(64).optional(),
    /** Lets staff move an appointment outside normal hours. Never past an
     *  overlap, which is checked regardless. */
    overrideAvailability: z.boolean().default(false),
  }),
  z.object({
    action: z.literal('notes'),
    internalNotes: z.string().trim().max(2000),
  }),
  z.object({
    action: z.literal('deposit_paid'),
  }),
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await requireStaffApi())) {
    return fail('UNAUTHORIZED', 'Please sign in to the staff area.', 401);
  }

  const { id } = await context.params;
  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  const { data } = parsed;

  try {
    switch (data.action) {
      case 'status': {
        await setAppointmentStatus({
          appointmentId: id,
          status: data.status,
          internalNote: data.internalNote,
        });
        return ok({ id, status: data.status });
      }

      case 'move': {
        const updated = await rescheduleBooking({
          appointmentId: id,
          date: data.date,
          startMinutes: data.startMinutes,
          dentistId: data.dentistId,
          actor: 'admin',
          overrideAvailability: data.overrideAvailability,
        });
        return ok(updated);
      }

      case 'notes': {
        const appointment = await prisma.appointment.update({
          where: { id },
          data: { internalNotes: data.internalNotes },
          select: { id: true, dentistId: true, startTime: true },
        });
        await prisma.appointmentEvent.create({
          data: {
            appointmentId: id,
            type: 'note_added',
            actor: 'admin',
          },
        });
        invalidateAvailability({
          dentistIds: [appointment.dentistId],
          dates: [todayLocalDate(appointment.startTime)],
        });
        return ok({ id });
      }

      case 'deposit_paid': {
        await markDepositPaid(id);
        return ok({ id, depositStatus: 'paid' });
      }
    }
  } catch (error) {
    return handleError(error);
  }
}
