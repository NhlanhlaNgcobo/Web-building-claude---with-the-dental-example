import { z } from 'zod';
import {
  findNextAvailable,
  getDayAvailability,
} from '@/lib/availability/service';
import { getServiceBySlug } from '@/lib/queries';
import { handleError, ok, parseQuery } from '@/lib/api/respond';
import { zDentistSelection, zLocalDate } from '@/lib/validation/primitives';
import { todayLocalDate } from '@/lib/availability/tz';

/**
 * The earliest available appointments.
 *
 * One endpoint serving the hero availability card, the next-appointment call
 * to action on each treatment page, and the emergency earliest-first search,
 * so all three are computed by the same engine and cannot disagree.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Query = z.object({
  service: z.string().trim().min(1).max(64),
  dentist: zDentistSelection.default('any'),
  from: zLocalDate.optional(),
  count: z.coerce.number().int().min(1).max(10).default(3),
  /** Hard capped in the schema, so an unbounded scan is unrepresentable. */
  maxDays: z.coerce.number().int().min(1).max(120).default(60),
  onePerDay: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  /** Include a count of what is left today, for the honest scarcity line. */
  withToday: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export async function GET(request: Request) {
  const parsed = parseQuery(request, Query);
  if (!parsed.ok) return parsed.response;

  try {
    const service = await getServiceBySlug(parsed.data.service);
    if (!service) {
      return ok({ slots: [], daysScanned: 0, exhausted: true, remainingToday: null });
    }

    const next = await findNextAvailable({
      serviceId: service.id,
      dentistId: parsed.data.dentist,
      fromDate: parsed.data.from,
      count: parsed.data.count,
      maxDays: parsed.data.maxDays,
      onePerDay: parsed.data.onePerDay,
    });

    let remainingToday: number | null = null;
    if (parsed.data.withToday) {
      const today = await getDayAvailability({
        date: todayLocalDate(),
        serviceId: service.id,
        dentistId: parsed.data.dentist,
        includeFallback: false,
      });
      remainingToday = today.slots.length;
    }

    return ok({
      ...next,
      remainingToday,
      service: {
        slug: service.slug,
        name: service.name,
        durationMinutes: service.durationMinutes,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
