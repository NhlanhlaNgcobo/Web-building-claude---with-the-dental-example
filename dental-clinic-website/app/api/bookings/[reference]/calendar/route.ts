import { getBookingByToken } from '@/lib/booking/service';
import { buildIcs } from '@/lib/providers/calendar/ics';
import { clinic, formatAddressOneLine } from '@/data/clinic';

/**
 * Download an appointment as a calendar file.
 *
 * Generated on the fly rather than stored, and requires a valid management
 * token, so an appointment cannot be read by guessing a reference.
 *
 * This needs no Google or Microsoft integration: the .ics format is imported
 * by Google Calendar, Outlook and Apple Calendar alike. The CalendarProvider
 * interface is there for the day the practice wants events pushed directly
 * into a dentist's own calendar instead.
 */
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  const { reference } = await context.params;
  const token = new URL(request.url).searchParams.get('token') ?? '';

  const booking = await getBookingByToken(reference, token);
  if (!booking) {
    return new Response('Not found', { status: 404 });
  }

  const ics = buildIcs({
    uid: `${booking.reference}@harbourdental.co.za`,
    title: `${booking.serviceName} at ${clinic.name}`,
    description: [
      `Appointment: ${booking.serviceName}`,
      `With: ${booking.dentistName}`,
      `Reference: ${booking.reference}`,
      '',
      `Practice: ${clinic.telephone.display}`,
      'Please arrive five minutes early.',
    ].join('\n'),
    start: new Date(booking.startTime),
    end: new Date(booking.endTime),
    location: formatAddressOneLine(),
  });

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${booking.reference}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
