import { z } from 'zod';
import { requireStaffApi } from '@/lib/admin/auth';
import { createBooking } from '@/lib/booking/service';
import { fail, handleError, ok, parseJson } from '@/lib/api/respond';
import {
  zDentistSelection,
  zEmail,
  zLocalDate,
  zLocalMinutes,
  zMobileZA,
  zName,
} from '@/lib/validation/primitives';

/**
 * Create an appointment from the staff diary.
 *
 * `overrideAvailability` lets reception fit somebody in outside the normal
 * rules: before opening, during a lunch break, inside the minimum lead time.
 * It does NOT bypass the overlap check, and that distinction is the whole
 * point. Policy is negotiable by a human who can see the consequences; two
 * patients in one chair at one time is not.
 */
export const dynamic = 'force-dynamic';

const Body = z.object({
  service: z.string().trim().min(1).max(64),
  dentist: zDentistSelection,
  date: zLocalDate,
  startMinutes: zLocalMinutes,
  patient: z.object({
    firstName: zName('first name'),
    lastName: zName('surname'),
    email: zEmail,
    mobile: zMobileZA,
    isExistingPatient: z.boolean().default(true),
  }),
  notes: z.string().trim().max(1000).optional(),
  source: z.enum(['phone', 'walk_in', 'admin']).default('phone'),
  overrideAvailability: z.boolean().default(false),
});

export async function POST(request: Request) {
  if (!(await requireStaffApi())) {
    return fail('UNAUTHORIZED', 'Please sign in to the staff area.', 401);
  }

  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  const { data } = parsed;

  try {
    const { getServiceBySlug } = await import('@/lib/queries');
    const service = await getServiceBySlug(data.service);
    if (!service) {
      return fail('VALIDATION_ERROR', 'That appointment type does not exist.', 400);
    }

    const confirmation = await createBooking({
      serviceId: service.id,
      dentistId: data.dentist,
      date: data.date,
      startMinutes: data.startMinutes,
      patient: data.patient,
      notes: data.notes,
      source: data.source,
      overrideAvailability: data.overrideAvailability,
    });

    return ok(confirmation, 201);
  } catch (error) {
    return handleError(error);
  }
}
