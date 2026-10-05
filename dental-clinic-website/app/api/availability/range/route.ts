import { z } from 'zod';
import { getRangeAvailability } from '@/lib/availability/service';
import { getServiceBySlug } from '@/lib/queries';
import { handleError, ok, parseQuery } from '@/lib/api/respond';
import { zDentistSelection, zLocalDate } from '@/lib/validation/primitives';

/**
 * Per-day slot counts across a range, used to shade the booking calendar so
 * that unavailable days are disabled before the patient clicks them.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Query = z.object({
  from: zLocalDate,
  days: z.coerce.number().int().min(1).max(62).default(42),
  service: z.string().trim().min(1).max(64),
  dentist: zDentistSelection.default('any'),
  exclude: z.string().trim().max(64).optional(),
});

export async function GET(request: Request) {
  const parsed = parseQuery(request, Query);
  if (!parsed.ok) return parsed.response;

  try {
    const service = await getServiceBySlug(parsed.data.service);
    if (!service) return ok({ availableDates: [], slotCountByDate: {} });

    const range = await getRangeAvailability({
      fromDate: parsed.data.from,
      days: parsed.data.days,
      serviceId: service.id,
      dentistId: parsed.data.dentist,
      excludeAppointmentId: parsed.data.exclude,
    });

    return ok(range);
  } catch (error) {
    return handleError(error);
  }
}
