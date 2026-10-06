import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireStaffApi } from '@/lib/admin/auth';
import { fail, handleError, ok, parseJson } from '@/lib/api/respond';
import { adjustStock } from '@/lib/orders/service';
import { StockReason } from '@/lib/domain/enums';

/**
 * Adjust stock by hand.
 *
 * Every adjustment carries a reason and is written to the movement ledger, so
 * the quantity on a variant is always explainable from its history rather than
 * being a number somebody typed. That is what makes a stock discrepancy
 * findable a month later instead of being an argument.
 *
 * `delta` rather than an absolute quantity on purpose. "Three arrived" and
 * "two were damaged" are what actually happen; setting the number to seven
 * loses the reason and races with a sale happening at the same moment.
 */
export const dynamic = 'force-dynamic';

const adjustSchema = z.object({
  variantId: z.string().min(1).max(64),
  delta: z
    .number()
    .int('Stock moves in whole units.')
    .refine((n) => n !== 0, 'A movement of zero is not a movement.')
    .refine((n) => Math.abs(n) <= 500, 'That is larger than any real movement.'),
  reason: StockReason.schema,
  note: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    if (!(await requireStaffApi())) {
      return fail('UNAUTHORIZED', 'Please sign in to the staff area.', 401);
    }

    const parsed = await parseJson(request, adjustSchema);
    if (!parsed.ok) return parsed.response;

    const resulting = await adjustStock({
      variantId: parsed.data.variantId,
      delta: parsed.data.delta,
      reason: parsed.data.reason,
      ...(parsed.data.note ? { note: parsed.data.note } : {}),
    });

    revalidateTag('catalogue', 'max');

    return ok({ variantId: parsed.data.variantId, stockQuantity: resulting });
  } catch (error) {
    return handleError(error);
  }
}
