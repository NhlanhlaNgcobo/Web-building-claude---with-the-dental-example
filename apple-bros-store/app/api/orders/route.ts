import { revalidateTag } from 'next/cache';
import { createOrder } from '@/lib/orders/service';
import { handleError, ok, parseJson } from '@/lib/api/respond';
import { createOrderSchema } from '@/lib/validation/schemas';
import { absoluteUrl } from '@/data/store';
import { paymentProvider } from '@/lib/providers/payment';
import { notifier } from '@/lib/providers/notifications';

/**
 * Place an order.
 *
 * The sequence matters and is worth stating plainly, because getting it the
 * other way round is the classic overselling bug:
 *
 *   1. Commit the stock inside a transaction. If that fails, nothing else runs
 *      and the customer is told exactly which line is short.
 *   2. Only then start a payment. An order exists before any money is asked
 *      for, so a payment can never succeed against stock we do not have.
 *
 * A failure in step 2 leaves a real order in awaiting_payment with its stock
 * held, which is the safe side to fail on: the shop can chase it, and nothing
 * has been sold twice.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, createOrderSchema);
    if (!parsed.ok) return parsed.response;
    const input = parsed.data;

    const order = await createOrder({
      lines: input.lines,
      customer: {
        name: input.customerName,
        email: input.customerEmail,
        mobile: input.customerMobile,
      },
      fulfilment: input.fulfilment,
      paymentMethod: input.paymentMethod,
      ...(input.fulfilment === 'delivery'
        ? {
            address: {
              line1: input.addressLine1!,
              ...(input.addressLine2 ? { line2: input.addressLine2 } : {}),
              suburb: input.suburb!,
              city: input.city!,
              province: input.province!,
              postalCode: input.postalCode!,
            },
          }
        : {}),
      ...(input.notes ? { customerNote: input.notes } : {}),
      ...(input.tradeInReference
        ? { tradeInReference: input.tradeInReference }
        : {}),
    });

    /**
     * Stock has moved, so anything cached that quotes a price or an
     * availability is now stale. 'max' expiry is right here rather than the
     * immediate expiry an appointment diary would need: a catalogue page that
     * is a few seconds behind is not harmful, because the order transaction is
     * what actually decides whether a sale can happen.
     */
    revalidateTag('catalogue', 'max');

    const intent = await paymentProvider().initiate({
      orderReference: order.reference,
      amount: { amountCents: order.totalCents, currency: 'ZAR' },
      customer: {
        name: input.customerName,
        email: input.customerEmail,
        mobile: input.customerMobile,
      },
      returnUrl: absoluteUrl(`/order/${order.reference}`),
      cancelUrl: absoluteUrl('/basket'),
    });

    // Confirmation is sent on a best-effort basis. The confirmation page
    // carries everything the customer needs, so a notifier that is not
    // configured must never fail an order that has already taken stock.
    void notifier()
      .orderPlaced({
        reference: order.reference,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        totalCents: order.totalCents,
        fulfilment: input.fulfilment,
        paymentInstruction: intent.ok ? intent.data.instruction : null,
      })
      .catch((error: unknown) => {
        console.error('[orders] confirmation not sent', error);
      });

    return ok(
      {
        reference: order.reference,
        status: order.status,
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        tradeInCents: order.tradeInCents,
        totalCents: order.totalCents,
        payment: intent.ok
          ? {
              instruction: intent.data.instruction,
              redirectUrl: intent.data.redirectUrl,
            }
          : null,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
