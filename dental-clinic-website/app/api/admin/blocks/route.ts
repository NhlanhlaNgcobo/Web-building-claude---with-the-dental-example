import { z } from 'zod';
import { requireStaffApi } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';
import { ACTIVE_APPOINTMENT_STATUSES, BlockReason } from '@/lib/domain/enums';
import { fail, handleError, ok, parseJson } from '@/lib/api/respond';
import { zLocalDate, zLocalMinutes } from '@/lib/validation/primitives';
import {
  addLocalDays,
  formatLocalDateShort,
  formatLocalMinutes,
  toInstant,
} from '@/lib/availability/tz';
import { invalidateAvailability } from '@/lib/cache/tags';

/**
 * Block time off in the diary.
 *
 * A null dentistId blocks the whole clinic, which is how a public holiday or
 * equipment service is recorded.
 *
 * Blocking over existing appointments is refused unless `force` is set, and
 * the refusal lists exactly which appointments are affected. The alternative
 * designs are both worse: silently cancelling a real patient's booking is
 * unacceptable, and silently accepting an appointment nobody can service is
 * also unacceptable. An explicit confirmation by the person who can see the
 * consequences is the only honest option.
 */
export const dynamic = 'force-dynamic';

const Body = z
  .object({
    /** Null blocks every dentist. */
    dentistId: z.string().trim().min(1).max(64).nullable(),
    date: zLocalDate,
    /** Ignored when allDay is true. */
    startMinutes: zLocalMinutes.optional(),
    endMinutes: zLocalMinutes.optional(),
    allDay: z.boolean().default(false),
    /** Inclusive last day, for a run of leave. */
    untilDate: zLocalDate.optional(),
    reason: BlockReason.schema,
    note: z.string().trim().max(500).optional(),
    force: z.boolean().default(false),
  })
  .refine(
    (v) =>
      v.allDay ||
      (v.startMinutes !== undefined &&
        v.endMinutes !== undefined &&
        v.endMinutes > v.startMinutes),
    {
      message: 'Give a start and end time, with the end after the start',
      path: ['endMinutes'],
    },
  );

export async function POST(request: Request) {
  if (!(await requireStaffApi())) {
    return fail('UNAUTHORIZED', 'Please sign in to the staff area.', 401);
  }

  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  const { data } = parsed;

  try {
    const startInstant = data.allDay
      ? toInstant(data.date, 0)
      : toInstant(data.date, data.startMinutes!);

    const lastDay = data.untilDate ?? data.date;
    const endInstant = data.allDay
      ? toInstant(addLocalDays(lastDay, 1), 0)
      : toInstant(lastDay, data.endMinutes!);

    if (endInstant <= startInstant) {
      return fail(
        'VALIDATION_ERROR',
        'That period ends before it starts.',
        400,
      );
    }

    // Which appointments would this block sit on top of?
    const affected = await prisma.appointment.findMany({
      where: {
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        startTime: { lt: endInstant },
        endTime: { gt: startInstant },
        ...(data.dentistId ? { dentistId: data.dentistId } : {}),
      },
      include: { patient: true, dentist: true, service: true },
      orderBy: { startTime: 'asc' },
    });

    if (affected.length > 0 && !data.force) {
      return fail(
        'BLOCK_CONFLICTS_APPOINTMENTS',
        `${affected.length} booked ${affected.length === 1 ? 'appointment falls' : 'appointments fall'} inside that period. Confirm to block it anyway, then contact the patients to rearrange.`,
        409,
        {
          fieldErrors: {
            affected: affected.map((a) => {
              const date = a.startTime.toISOString().slice(0, 10);
              return `${formatLocalDateShort(date)} ${formatLocalMinutes(
                a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes() + 120,
              )} ${a.patient.firstName} ${a.patient.lastName} (${a.reference}) with ${a.dentist.title} ${a.dentist.lastName}`;
            }),
          },
        },
      );
    }

    const block = await prisma.blockedTime.create({
      data: {
        dentistId: data.dentistId,
        startTime: startInstant,
        endTime: endInstant,
        reason: data.reason,
        note: data.note ?? null,
      },
    });

    // Flag affected appointments for follow-up rather than cancelling them.
    for (const appointment of affected) {
      await prisma.appointmentEvent.create({
        data: {
          appointmentId: appointment.id,
          type: 'note_added',
          actor: 'admin',
          payloadJson: JSON.stringify({
            reason: 'Time blocked over this appointment. Contact the patient to rearrange.',
            blockId: block.id,
          }),
        },
      });
    }

    invalidateAvailability({
      dentistIds: data.dentistId ? [data.dentistId] : [],
      dates: [data.date],
    });

    return ok(
      {
        id: block.id,
        affectedAppointments: affected.length,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
