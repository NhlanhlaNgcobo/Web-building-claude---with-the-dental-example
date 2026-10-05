import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateOrderReference, normalizeReference } from '@/lib/booking/reference';
import { handleError, fail, ok, parseJson } from '@/lib/api/respond';
import {
  normalizeEmail,
  zEmail,
  zMobileZA,
  zName,
} from '@/lib/validation/primitives';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/domain/enums';

/**
 * Place a product order for collection.
 *
 * Prices are never taken from the request. The server re-reads every price
 * from the database and computes the total itself, so a tampered basket
 * changes nothing: a client-supplied total is ignored entirely rather than
 * compared against anything.
 *
 * Nothing is charged here. Payment happens at collection, which is why there
 * is no gateway call and no card field.
 */
export const dynamic = 'force-dynamic';

const Body = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(64),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, 'Your basket is empty')
    .max(20),
  contact: z.object({
    name: zName('name'),
    email: zEmail,
    mobile: zMobileZA,
  }),
  fulfilment: z.enum(['collect', 'collect_at_appointment']),
  /**
   * Only used when collecting at an appointment. The order is attached to the
   * appointment only when the reference AND the email both match, so a
   * reference on its own reveals nothing.
   */
  appointmentReference: z.string().trim().max(24).optional(),
  notes: z.string().trim().max(500).optional(),
  popiaConsent: z.literal(true, {
    message: 'Please consent to us storing your contact details',
  }),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  const { data } = parsed;

  try {
    const products = await prisma.product.findMany({
      where: {
        id: { in: data.items.map((i) => i.productId) },
        isActive: true,
      },
    });

    if (products.length === 0) {
      return fail(
        'VALIDATION_ERROR',
        'None of those products are available.',
        400,
      );
    }

    const byId = new Map(products.map((p) => [p.id, p]));
    const contactEmailNormalized = normalizeEmail(data.contact.email);

    // Attach to an appointment only when both the reference and the email
    // match a live booking.
    let appointmentId: string | null = null;
    if (
      data.fulfilment === 'collect_at_appointment' &&
      data.appointmentReference
    ) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          reference: normalizeReference(data.appointmentReference),
          status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
          patient: { emailNormalized: contactEmailNormalized },
        },
        select: { id: true },
      });
      appointmentId = appointment?.id ?? null;
    }

    const order = await prisma.$transaction(async (tx) => {
      const lines = data.items
        .map((item) => {
          const product = byId.get(item.productId);
          if (!product) return null;
          return {
            productId: product.id,
            quantity: item.quantity,
            nameSnapshot: product.name,
            unitPriceCents: product.priceCents,
            lineTotalCents: product.priceCents * item.quantity,
          };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);

      if (lines.length === 0) {
        throw new Error('No valid order lines');
      }

      const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);

      // Retry on the unique reference constraint, as with appointments.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          return await tx.order.create({
            data: {
              reference: generateOrderReference(),
              contactName: data.contact.name,
              contactEmail: data.contact.email,
              contactEmailNormalized,
              contactMobile: data.contact.mobile,
              status: 'pending',
              fulfilment: data.fulfilment,
              appointmentId,
              subtotalCents,
              // No delivery and no courier, so the total is the subtotal.
              totalCents: subtotalCents,
              notes: data.notes ?? null,
              items: { create: lines },
            },
            include: { items: true },
          });
        } catch (error) {
          const code = (error as { code?: string }).code;
          if (code !== 'P2002') throw error;
        }
      }
      throw new Error('Could not generate an order reference');
    });

    return ok(
      {
        reference: order.reference,
        status: order.status,
        subtotalCents: order.subtotalCents,
        totalCents: order.totalCents,
        fulfilment: order.fulfilment,
        attachedToAppointment: appointmentId !== null,
        items: order.items.map((item) => ({
          name: item.nameSnapshot,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
        })),
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
