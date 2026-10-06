'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/TextField';
import { cn } from '@/lib/cn';
import { STOCK_REASON_LABELS, StockReason } from '@/lib/domain/enums';

/**
 * Adjusting a shelf quantity.
 *
 * Movements rather than absolute quantities. "Three arrived" and "two were
 * damaged" are what actually happen in a shop; typing a new total loses the
 * reason, and it silently overwrites a sale that landed while the dialog was
 * open.
 *
 * Every reason in the list is one that has a real meaning in the ledger, so the
 * history reads as a sequence of events rather than a column of corrections.
 */
const REASONS: readonly StockReason[] = [
  'intake',
  'returned',
  'damaged',
  'correction',
];

export function StockAdjuster({
  variantId,
  label,
  current,
}: {
  readonly variantId: string;
  readonly label: string;
  readonly current: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState<StockReason>('intake');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resulting = current + delta;

  async function save() {
    if (delta === 0 || saving) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          delta,
          reason,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });

      if (response.ok) {
        setOpen(false);
        setDelta(1);
        setNote('');
        router.refresh();
        return;
      }

      const body = (await response.json()) as { error?: { message?: string } };
      setError(body.error?.message ?? 'That adjustment did not go through.');
    } catch {
      setError('Could not reach the server. Stock has not changed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button variant="secondary" size="sm">
            Adjust
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-overlay bg-ink/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-modal w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-white p-6 shadow-[0_24px_60px_-20px_rgb(13_17_23/0.35)]">
          <Dialog.Title className="text-[1.125rem] font-bold text-ink">
            Adjust stock
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-[0.875rem] text-grey-strong">
            {label}
          </Dialog.Description>

          {/* ---- How many ---- */}
          <div className="mt-6">
            <span className="text-[0.8125rem] font-medium text-ink">
              Movement
            </span>
            <div className="mt-2 flex items-center gap-3">
              <div className="inline-flex items-center rounded-panel border border-line-strong">
                <button
                  type="button"
                  aria-label="One fewer"
                  onClick={() => setDelta((d) => d - 1)}
                  className="flex size-10 items-center justify-center rounded-l-panel text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <output
                  className={cn(
                    'text-spec w-16 text-center text-[1rem] font-medium',
                    delta < 0 ? 'text-red-deep' : 'text-leaf-deep',
                  )}
                >
                  {delta > 0 ? '+' : ''}
                  {delta}
                </output>
                <button
                  type="button"
                  aria-label="One more"
                  onClick={() => setDelta((d) => d + 1)}
                  className="flex size-10 items-center justify-center rounded-r-panel text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>

              <p className="text-[0.8125rem] tabular-nums text-grey-strong">
                {current} becomes{' '}
                <span
                  className={cn(
                    'font-semibold',
                    resulting < 0 ? 'text-red-deep' : 'text-ink',
                  )}
                >
                  {resulting}
                </span>
              </p>
            </div>
            {resulting < 0 && (
              <p className="mt-2 text-[0.75rem] text-red-deep">
                Stock cannot go below zero. The database rejects this, so it has
                to be a smaller reduction.
              </p>
            )}
          </div>

          {/* ---- Why ---- */}
          <fieldset className="mt-6">
            <legend className="text-[0.8125rem] font-medium text-ink">
              Reason
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {REASONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={reason === value}
                  onClick={() => setReason(value)}
                  className={cn(
                    'h-9 rounded-panel border px-3 text-[0.8125rem] font-medium',
                    'transition-[background-color,border-color,color] duration-[--duration-feedback]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
                    reason === value
                      ? 'border-ink bg-ink text-white'
                      : 'border-line-strong bg-white text-grey-strong hover:border-ink hover:text-ink',
                  )}
                >
                  {STOCK_REASON_LABELS[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5">
            <TextAreaField
              name="note"
              label="Note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              description="Goes into the ledger. Worth writing, because this is what explains a discrepancy a month from now."
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-panel border border-red/30 bg-red-soft p-3 text-[0.8125rem] leading-relaxed text-ink"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-red-deep"
                aria-hidden="true"
              />
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close render={<Button variant="secondary">Cancel</Button>} />
            <Button
              onClick={save}
              loading={saving}
              disabled={delta === 0 || resulting < 0}
            >
              Record it
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
