'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/TextField';
import {
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  type OrderStatus,
} from '@/lib/domain/enums';

/**
 * Moving an order along.
 *
 * Only the transitions the state machine allows are offered, read from the
 * same ORDER_TRANSITIONS map the server enforces. A button that cannot work is
 * never rendered, which is better than one that fails when pressed.
 *
 * Cancelling and refunding return stock to the shelf and cannot be undone, so
 * both go behind an AlertDialog that says what will happen. The ordinary
 * forward steps do not, because they are routine and reversible by moving the
 * order on again.
 */
const DESTRUCTIVE: readonly OrderStatus[] = ['cancelled', 'refunded'];

export function OrderActions({
  reference,
  status,
}: {
  readonly reference: string;
  readonly status: OrderStatus;
}) {
  const router = useRouter();
  const [working, setWorking] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = ORDER_TRANSITIONS[status];

  async function move(to: OrderStatus, reason?: string) {
    setWorking(to);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${reference}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: to, ...(reason ? { reason } : {}) }),
      });

      if (response.ok) {
        router.refresh();
        return;
      }

      const body = (await response.json()) as { error?: { message?: string } };
      setError(body.error?.message ?? 'That change did not go through.');
    } catch {
      setError('Could not reach the server. The order has not changed.');
    } finally {
      setWorking(null);
    }
  }

  if (next.length === 0) {
    return (
      <p className="text-[0.8125rem] leading-relaxed text-grey-strong">
        This order is {ORDER_STATUS_LABELS[status].toLowerCase()}. There is
        nothing further to move it to.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {next.map((to) =>
          DESTRUCTIVE.includes(to) ? (
            <DestructiveAction
              key={to}
              to={to}
              working={working === to}
              onConfirm={(reason) => move(to, reason)}
            />
          ) : (
            <Button
              key={to}
              size="sm"
              loading={working === to}
              onClick={() => move(to)}
            >
              Mark {ORDER_STATUS_LABELS[to].toLowerCase()}
            </Button>
          ),
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-panel border border-red/30 bg-red-soft p-3 text-[0.8125rem] leading-relaxed text-ink"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-red-deep"
            aria-hidden="true"
          />
          {error}
        </p>
      )}
    </div>
  );
}

function DestructiveAction({
  to,
  working,
  onConfirm,
}: {
  readonly to: OrderStatus;
  readonly working: boolean;
  readonly onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const verb = to === 'cancelled' ? 'Cancel' : 'Refund';

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger
        render={
          <Button variant="secondary" size="sm" loading={working}>
            {verb} this order
          </Button>
        }
      />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-overlay bg-ink/40" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-modal w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-white p-6 shadow-[0_24px_60px_-20px_rgb(13_17_23/0.35)]">
          <AlertDialog.Title className="text-[1.125rem] font-bold text-ink">
            {verb} this order?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
            Every item on it goes back onto the shelf and becomes buyable again
            straight away. A movement is written to the stock ledger for each
            one. This cannot be undone from here.
          </AlertDialog.Description>

          <div className="mt-5">
            <TextAreaField
              name="reason"
              label="Why"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              description="Goes to the customer with the notification, so write it for them."
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close
              render={<Button variant="secondary">Leave it as it is</Button>}
            />
            <AlertDialog.Close
              onClick={() => onConfirm(reason.trim())}
              render={<Button variant="critical">{verb} it</Button>}
            />
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
