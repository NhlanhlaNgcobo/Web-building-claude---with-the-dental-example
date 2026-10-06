import { getStockLevels } from '@/lib/catalogue/queries';
import { fail, handleError, ok, parseJson } from '@/lib/api/respond';
import { stockRequestSchema } from '@/lib/validation/schemas';

/**
 * Current stock and price for a set of variants.
 *
 * Used by the basket to warn about a shortfall or a price change before the
 * customer reaches checkout. It is advisory only: the authority is the
 * conditional decrement inside the order transaction, because stock can change
 * between this read and that write.
 *
 * POST rather than GET because the body is a list of ids, and because a GET
 * would invite a cache to hold stock levels, which is exactly how two people
 * get shown the same last unit.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, stockRequestSchema);
    if (!parsed.ok) return parsed.response;

    const levels = await getStockLevels(parsed.data.variantIds);

    // Ids we were asked about but did not find are reported as unavailable
    // rather than omitted, so the client does not have to treat a missing
    // entry as ambiguous.
    const found = new Set(levels.map((l) => l.variantId));
    const missing = parsed.data.variantIds
      .filter((id) => !found.has(id))
      .map((id) => ({
        variantId: id,
        stockQuantity: 0,
        isActive: false,
        priceCents: 0,
      }));

    return ok({ levels: [...levels, ...missing] });
  } catch (error) {
    return handleError(error);
  }
}

export function GET() {
  return fail(
    'METHOD_NOT_ALLOWED',
    'Stock levels are read with a POST request.',
    405,
  );
}
