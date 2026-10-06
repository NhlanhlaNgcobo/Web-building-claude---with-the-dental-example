import { handleError, ok, parseJson } from '@/lib/api/respond';
import { quoteTradeIn, submitTradeIn } from '@/lib/tradein/service';
import { tradeInQuoteSchema, tradeInSubmitSchema } from '@/lib/validation/schemas';
import { notifier } from '@/lib/providers/notifications';

/**
 * Two things on one route, separated by whether the body carries contact
 * details.
 *
 * PUT prices a device and returns the figure with its arithmetic shown. It
 * writes nothing, so somebody can try different answers without leaving a trail
 * of records or handing over an email address to see a number.
 *
 * POST records the quote they want to act on, which is the point at which
 * contact details are needed and therefore the point at which they are asked
 * for.
 */
export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const parsed = await parseJson(request, tradeInQuoteSchema);
    if (!parsed.ok) return parsed.response;

    const { quote, model, expiresAt } = await quoteTradeIn(parsed.data);

    return ok({
      deviceLabel: model.label,
      baseCents: quote.baseCents,
      adjustments: quote.adjustments,
      valueCents: quote.valueCents,
      isAccepted: quote.isAccepted,
      declineReason: quote.declineReason,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, tradeInSubmitSchema);
    if (!parsed.ok) return parsed.response;

    const result = await submitTradeIn(parsed.data);

    if (!result.accepted) {
      // Returned as a successful response carrying a decline, not as an error.
      // Nothing went wrong: the answer is that we cannot buy this one, and the
      // reason is written for the customer to read.
      return ok({
        accepted: false,
        declineReason: result.quote.declineReason,
        reference: null,
      });
    }

    void notifier()
      .tradeInQuoted({
        reference: result.reference,
        customerEmail: parsed.data.customerEmail,
        deviceLabel: result.model.label,
        valueCents: result.quote.valueCents,
        expiresAt: result.expiresAt,
      })
      .catch((error: unknown) => {
        console.error('[trade-in] quote email not sent', error);
      });

    return ok(
      {
        accepted: true,
        reference: result.reference,
        valueCents: result.quote.valueCents,
        expiresAt: result.expiresAt.toISOString(),
        validDays: result.validDays,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
