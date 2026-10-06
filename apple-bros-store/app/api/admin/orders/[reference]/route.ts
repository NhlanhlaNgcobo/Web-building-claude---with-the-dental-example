import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireStaffApi } from '@/lib/admin/auth';
import { fail, handleError, ok, parseJson } from '@/lib/api/respond';
import { setOrderStatus } from '@/lib/orders/service';
import { normalizeReference } from '@/lib/orders/reference';
import { OrderStatus } from '@/lib/domain/enums';
import { notifier } from '@/lib/providers/notifications';
import { ORDER_STATUS_LABELS } from '@/lib/domain/enums';

/**
 * Move an order to a new status.
 *
 * The transition itself is validated inside setOrderStatus against the state
 * machine in lib/domain/enums.ts, so an impossible move is rejected there
 * rather than here. This route does the staff check, the parsing and the
 * notification, and lets the domain own the rule.
 *
 * Cancelling or refunding returns the stock and writes the ledger rows. That
 * happens inside the same transaction as the status change, because stock that
 * came back without a corresponding status change, or the other way round,
 * is exactly the inconsistency a shop cannot reconcile afterwards.
 */
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  status: OrderStatus.schema,
  reason: z.string().trim().max(300).optional(),
  internalNote: z.string().trim().max(1000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: RouteContext<'/api/admin/orders/[reference]'>,
) {
  try {
    if (!(await requireStaffApi())) {
      return fail('UNAUTHORIZED', 'Please sign in to the staff area.', 401);
    }

    const { reference } = await params;
    const parsed = await parseJson(request, patchSchema);
    if (!parsed.ok) return parsed.response;

    const order = await prisma.order.findUnique({
      where: { reference: normalizeReference(reference) },
      select: { id: true, reference: true, customerEmail: true },
    });
    if (!order) {
      return fail('NOT_FOUND', 'No order with that reference.', 404);
    }

    await setOrderStatus({
      orderId: order.id,
      status: parsed.data.status,
      ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
      ...(parsed.data.internalNote
        ? { internalNote: parsed.data.internalNote }
        : {}),
    });

    // Returning stock changes what the shop can sell, so the catalogue cache
    // is no longer right.
    revalidateTag('catalogue', 'max');

    void notifier()
      .orderStatusChanged({
        reference: order.reference,
        customerEmail: order.customerEmail,
        status: ORDER_STATUS_LABELS[parsed.data.status],
        note: parsed.data.reason ?? null,
      })
      .catch((error: unknown) => {
        console.error('[admin] status email not sent', error);
      });

    return ok({ reference: order.reference, status: parsed.data.status });
  } catch (error) {
    return handleError(error);
  }
}
