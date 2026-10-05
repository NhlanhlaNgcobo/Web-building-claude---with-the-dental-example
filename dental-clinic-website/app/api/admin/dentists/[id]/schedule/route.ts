import { z } from 'zod';
import { requireStaffApi } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/domain/enums';
import { fail, handleError, ok, parseJson } from '@/lib/api/respond';
import { invalidateAvailability } from '@/lib/cache/tags';

/**
 * Replace a dentist weekly working pattern.
 *
 * A full replace rather than a patch, because a roster is edited as a whole
 * and because replace is the only shape in which "stop working Fridays" is
 * expressible at all.
 *
 * As with blocking time, narrowing a roster over existing appointments is
 * refused unless forced, and the refusal names what is affected. Silently
 * orphaning a booked patient is not an acceptable outcome of a settings
 * change.
 */
export const dynamic = 'force-dynamic';

const Slot = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinutes: z.number().int().min(0).max(1439),
    endMinutes: z.number().int().min(1).max(1440),
    breakStartMinutes: z.number().int().min(0).max(1439).nullable(),
    breakEndMinutes: z.number().int().min(1).max(1440).nullable(),
  })
  .refine((s) => s.endMinutes > s.startMinutes, {
    message: 'The end of a shift must be after its start',
    path: ['endMinutes'],
  })
  .refine((s) => (s.breakStartMinutes === null) === (s.breakEndMinutes === null), {
    message: 'Give both a break start and a break end, or neither',
    path: ['breakStartMinutes'],
  })
  .refine(
    (s) =>
      s.breakStartMinutes === null ||
      s.breakEndMinutes === null ||
      (s.breakEndMinutes > s.breakStartMinutes &&
        s.breakStartMinutes >= s.startMinutes &&
        s.breakEndMinutes <= s.endMinutes),
    {
      message: 'A break must sit inside the shift',
      path: ['breakStartMinutes'],
    },
  );

const Body = z.object({
  schedules: z.array(Slot).max(14),
  force: z.boolean().default(false),
});

export async function PUT(
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
    const dentist = await prisma.dentist.findUnique({ where: { id } });
    if (!dentist) {
      return fail('NOT_FOUND', 'That dentist does not exist.', 404);
    }

    // Reject two overlapping shifts on the same weekday before writing anything.
    const byDay = new Map<number, typeof data.schedules>();
    for (const slot of data.schedules) {
      const list = byDay.get(slot.dayOfWeek) ?? [];
      for (const existing of list) {
        if (
          slot.startMinutes < existing.endMinutes &&
          existing.startMinutes < slot.endMinutes
        ) {
          return fail(
            'VALIDATION_ERROR',
            'Two shifts on the same day overlap.',
            400,
          );
        }
      }
      list.push(slot);
      byDay.set(slot.dayOfWeek, list);
    }

    // Future appointments that would fall outside the new pattern.
    const future = await prisma.appointment.findMany({
      where: {
        dentistId: id,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        startTime: { gte: new Date() },
      },
      select: { id: true, startTime: true, reference: true },
    });

    const orphaned = future.filter((appointment) => {
      // Local weekday and minutes in the practice timezone, which is a
      // constant UTC+2 with no daylight saving.
      const local = new Date(appointment.startTime.getTime() + 2 * 3_600_000);
      const dow = local.getUTCDay();
      const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
      const shifts = byDay.get(dow) ?? [];
      return !shifts.some(
        (s) => minutes >= s.startMinutes && minutes < s.endMinutes,
      );
    });

    if (orphaned.length > 0 && !data.force) {
      return fail(
        'SCHEDULE_CONFLICTS_APPOINTMENTS',
        `${orphaned.length} booked ${orphaned.length === 1 ? 'appointment falls' : 'appointments fall'} outside the new pattern. Confirm to save it anyway, then contact those patients to rearrange.`,
        409,
        { fieldErrors: { affected: orphaned.map((a) => a.reference) } },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.dentistSchedule.deleteMany({ where: { dentistId: id } });
      for (const slot of data.schedules) {
        await tx.dentistSchedule.create({
          data: {
            dentistId: id,
            dayOfWeek: slot.dayOfWeek,
            startMinutes: slot.startMinutes,
            endMinutes: slot.endMinutes,
            breakStartMinutes: slot.breakStartMinutes,
            breakEndMinutes: slot.breakEndMinutes,
          },
        });
      }
    });

    invalidateAvailability({ dentistIds: [id] });

    return ok({
      id,
      shifts: data.schedules.length,
      affectedAppointments: orphaned.length,
    });
  } catch (error) {
    return handleError(error);
  }
}
