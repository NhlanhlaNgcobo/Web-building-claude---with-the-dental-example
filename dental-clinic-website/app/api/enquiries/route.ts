import { z } from 'zod';
import { handleError, ok, parseJson } from '@/lib/api/respond';
import { getProviders } from '@/lib/providers/registry';
import { clinic } from '@/data/clinic';
import {
  zEmail,
  zName,
  zPhoneZA,
} from '@/lib/validation/primitives';

/**
 * General enquiry form.
 *
 * Routed through the notification provider, which by default writes to the
 * server log. That means the form genuinely works with nothing configured:
 * staff can see enquiries in the server output, and connecting a real email
 * transport later is a provider registration rather than a change here.
 *
 * The response tells the patient plainly that the telephone is faster, because
 * with no email transport configured it is.
 */
export const dynamic = 'force-dynamic';

const Body = z.object({
  name: zName('name'),
  email: zEmail,
  phone: zPhoneZA.optional().or(z.literal('').transform(() => undefined)),
  subject: z.enum([
    'appointment',
    'treatment',
    'fees',
    'records',
    'other',
  ]),
  message: z
    .string()
    .trim()
    .min(10, 'Please tell us a little more so we can help')
    .max(2000),
  popiaConsent: z.literal(true, {
    message: 'Please consent to us storing your details to reply',
  }),
  honeypot: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  const { data } = parsed;

  try {
    const { notifications } = getProviders();

    await notifications.send({
      idempotencyKey: `enquiry:${data.email}:${Date.now()}`,
      event: {
        type: 'order_confirmed',
        // Reuses the simplest payload shape rather than adding an event type
        // for something that is not an appointment or an order. The log
        // provider records the detail below regardless.
        data: {
          reference: 'ENQUIRY',
          contactName: data.name,
          totalCents: 0,
          itemCount: 0,
        },
      },
      recipient: {
        name: 'Reception',
        email: clinic.email,
      },
      channels: ['email'],
    });

    // Logged explicitly so the enquiry is visible and actionable with no
    // transport configured.
    console.info('[enquiry]', {
      from: data.name,
      email: data.email,
      phone: data.phone ?? null,
      subject: data.subject,
      message: data.message,
      receivedAt: new Date().toISOString(),
    });

    return ok({
      received: true,
      message:
        'Thank you. We will reply as soon as we can during opening hours. If it is urgent, phoning reception is faster.',
    });
  } catch (error) {
    return handleError(error);
  }
}
