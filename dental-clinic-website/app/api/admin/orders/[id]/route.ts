import { z } from 'zod';
import { requireStaffApi } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';
import { OrderStatus } from '@/lib/domain/enums';
import { fail, handleError, ok, parseJson } from '@/lib/api/respond';

/** Move a product order through the fulfilment workflow. */
export const dynamic = 'force-dynamic';

const Body = z.object({
  status: OrderStatus.schema,
  notes: z.string().trim().max(500).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await requireStaffApi())) {
    return fail('UNAUTHORIZED', 'Please sign in to the staff area.', 401);
  }

  const { id } = await context.params;
  const parsed = await parseJson(request, Body);
  if (!parsed.ok) return parsed.response;

  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      },
      select: { id: true, status: true, reference: true },
    });
    return ok(order);
  } catch (error) {
    return handleError(error);
  }
}
