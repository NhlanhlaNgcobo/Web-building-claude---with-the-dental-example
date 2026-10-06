import { lookupOrder } from '@/lib/orders/service';
import { handleError, ok, parseJson } from '@/lib/api/respond';
import { orderLookupSchema } from '@/lib/validation/schemas';
import { ORDER_STATUS_LABELS } from '@/lib/domain/enums';
import type { OrderDto, OrderStatus } from '@/types';

/**
 * Look up an order with a reference and the email it was placed with.
 *
 * Two deliberate choices about what this does not do:
 *
 * It does not accept a reference alone. An order reference is short enough to
 * guess at, and the order carries a name and a delivery address, so the email
 * is the second factor that keeps somebody else's address out of a stranger's
 * hands.
 *
 * It does not distinguish a wrong reference from a wrong email. Both come back
 * as the same "not found", because a different message for each would let
 * somebody discover which references exist.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, orderLookupSchema);
    if (!parsed.ok) return parsed.response;

    const order = await lookupOrder(parsed.data.reference, parsed.data.email);

    const dto: OrderDto = {
      reference: order.reference,
      status: order.status as OrderStatus,
      placedAt: order.placedAt.toISOString(),
      customerName: order.customerName,
      fulfilment: order.fulfilment as OrderDto['fulfilment'],
      paymentMethod: order.paymentMethod as OrderDto['paymentMethod'],
      lines: order.items.map((item) => ({
        name: item.nameSnapshot,
        variantLabel: item.variantSnapshot,
        condition: item.conditionSnapshot as OrderDto['lines'][number]['condition'],
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        warrantyMonths: item.warrantyMonths,
        imageUrl: item.imageSnapshot,
      })),
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      tradeInCents: order.tradeInCents,
      totalCents: order.totalCents,
      deliveryAddress: [
        order.addressLine1,
        order.addressLine2,
        order.addressSuburb,
        order.addressCity && order.addressPostalCode
          ? `${order.addressCity}, ${order.addressPostalCode}`
          : order.addressCity,
        order.addressProvince,
      ].filter((line): line is string => Boolean(line && line.length > 0)),
    };

    return ok({
      order: dto,
      statusLabel: ORDER_STATUS_LABELS[dto.status],
    });
  } catch (error) {
    return handleError(error);
  }
}
