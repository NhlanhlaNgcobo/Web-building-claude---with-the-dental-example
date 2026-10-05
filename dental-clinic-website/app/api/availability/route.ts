import { z } from 'zod';
import { getDayAvailability } from '@/lib/availability/service';
import { getServiceBySlug } from '@/lib/queries';
import {
  handleError,
  ok,
  parseQuery,
} from '@/lib/api/respond';
import {
  zDentistSelection,
  zLocalDate,
} from '@/lib/validation/primitives';

/**
 * Available times for one day.
 *
 * Never cached. See lib/api/respond.ts for why.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Query = z.object({
  date: zLocalDate,
  /** Accepts a service slug, which is what the UI has in the URL. */
  service: z.string().trim().min(1).max(64),
  dentist: zDentistSelection.default('any'),
  includeFallback: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

export async function GET(request: Request) {
  const parsed = parseQuery(request, Query);
  if (!parsed.ok) return parsed.response;

  try {
    const service = await getServiceBySlug(parsed.data.service);
    if (!service) {
      return ok({
        date: parsed.data.date,
        dateLabel: '',
        weekday: '',
        slots: [],
        unavailableMessage:
          'That appointment type is not available to book online.',
        nextAvailable: [],
      });
    }

    const day = await getDayAvailability({
      date: parsed.data.date,
      serviceId: service.id,
      dentistId: parsed.data.dentist,
      includeFallback: parsed.data.includeFallback,
    });

    return ok(day);
  } catch (error) {
    return handleError(error);
  }
}
