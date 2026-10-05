import { z } from 'zod';
import { createBooking } from '@/lib/booking/service';
import { getServiceBySlug } from '@/lib/queries';
import { handleError, ok, parseJson } from '@/lib/api/respond';
import {
  zDentistSelection,
  zLocalDate,
  zLocalMinutes,
  zPatientDetails,
} from '@/lib/validation/primitives';

/**
 * Create a booking.
 *
 * Every field is validated here, and then the slot is validated again inside
 * the database transaction in lib/booking/service.ts. The date, time and
 * dentist arriving in this request are treated as a hint with no authority:
 * the server recomputes availability from the live diary before it will write
 * anything.
 */
export const dynamic = 'force-dynamic';

const Body = z.object({
  service: z.string().trim().min(1).max(64),
  dentist: zDentistSelection,
  date: zLocalDate,
  startMinutes: zLocalMinutes,
  patient: zPatientDetails,
  /**
   * Bots fill hidden fields that humans cannot see, so a non-empty value here
   * is a reliable signal. Cheap, and it needs no third-party captcha service.
   */
  honeypot: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  const { data } = parsed;

  try {
    const service = await getServiceBySlug(data.service);
    if (!service) {
      return ok(
        {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'That appointment type is not available to book online.',
          },
        },
        400,
      );
    }

    const confirmation = await createBooking({
      serviceId: service.id,
      dentistId: data.dentist,
      date: data.date,
      startMinutes: data.startMinutes,
      patient: {
        firstName: data.patient.firstName,
        lastName: data.patient.lastName,
        email: data.patient.email,
        mobile: data.patient.mobile,
        isExistingPatient: data.patient.isExistingPatient,
      },
      notes: data.patient.notes,
      source: 'web',
    });

    return ok(confirmation, 201);
  } catch (error) {
    return handleError(error);
  }
}
