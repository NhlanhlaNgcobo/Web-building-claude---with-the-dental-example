import { requireStaffApi } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';
import { fail, handleError, ok } from '@/lib/api/respond';
import { invalidateAvailability } from '@/lib/cache/tags';
import { todayLocalDate } from '@/lib/availability/tz';

/**
 * Unblock time.
 *
 * Deleting the row returns the period to availability immediately, because
 * every availability query reads blocked periods live rather than from a
 * cached projection.
 */
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await requireStaffApi())) {
    return fail('UNAUTHORIZED', 'Please sign in to the staff area.', 401);
  }

  const { id } = await context.params;

  try {
    const block = await prisma.blockedTime.findUnique({
      where: { id },
      select: { id: true, dentistId: true, startTime: true },
    });
    if (!block) {
      return fail('NOT_FOUND', 'That blocked period no longer exists.', 404);
    }

    await prisma.blockedTime.delete({ where: { id } });

    invalidateAvailability({
      dentistIds: block.dentistId ? [block.dentistId] : [],
      dates: [todayLocalDate(block.startTime)],
    });

    return ok({ id, removed: true });
  } catch (error) {
    return handleError(error);
  }
}
