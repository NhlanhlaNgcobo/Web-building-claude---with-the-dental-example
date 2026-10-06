import { cn } from '@/lib/cn';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/domain/enums';

/**
 * An order status, as a pill.
 *
 * Colour carries emphasis, never the meaning: the status is always spelled out
 * in the pill, so a staff member who cannot distinguish the tones reads exactly
 * the same information.
 */
export function StatusPill({
  status,
  className,
}: {
  readonly status: OrderStatus;
  readonly className?: string;
}) {
  const tone =
    status === 'cancelled' || status === 'refunded'
      ? 'bg-canvas-deep text-grey-strong'
      : status === 'completed'
        ? 'bg-leaf-soft text-leaf-deep'
        : status === 'pending_payment'
          ? 'bg-red-soft text-red-deep'
          : 'bg-canvas text-ink';

  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-panel px-2 py-1 text-[0.75rem] font-semibold',
        tone,
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
