import { handleError, ok, parseJson } from '@/lib/api/respond';
import { enquirySchema } from '@/lib/validation/schemas';
import { store } from '@/data/store';

/**
 * Contact form.
 *
 * With no mail transport configured, the enquiry is written to the server log
 * and the customer is told plainly that the quickest route is the telephone.
 * That is the honest behaviour: pretending a message was sent when nothing left
 * the building is how somebody waits three days for a reply that was never
 * coming.
 *
 * Nothing is stored. An enquiry is not an order, so there is no reason to keep
 * somebody's name and number in a database before they have asked us to.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, enquirySchema);
    if (!parsed.ok) return parsed.response;

    const { name, email, subject, marketingOptIn } = parsed.data;

    // The message body is deliberately not logged. A server log is read by
    // more people than an inbox is.
    console.info(
      `[enquiry] "${subject}" from ${name} <${email}>, marketing opt in: ${marketingOptIn}`,
    );

    return ok({
      received: true,
      // Set from the environment once a transport exists, so this message can
      // become "we have emailed you a copy" without touching the component.
      delivered: false,
      fallback: `Thank you. We read these during trading hours. If it is urgent, phone us on ${store.telephone.display} and you will reach somebody straight away.`,
    });
  } catch (error) {
    return handleError(error);
  }
}
