'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { AlertTriangle, Ban, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  BLOCK_REASON_LABELS,
  BlockReason,
  type BlockReason as Reason,
} from '@/lib/domain/enums';
import { formatLocalMinutes } from '@/lib/availability/tz';

/**
 * Block and unblock time.
 *
 * Blocking over booked appointments is refused on the first attempt and the
 * server says how many are affected. The confirmation below is what sends
 * `force`, so a staff member has to see the consequence before overriding it.
 * Nothing is auto-cancelled: affected appointments get a note for follow-up
 * and somebody has to telephone those patients.
 */

interface BlockRow {
  readonly id: string;
  readonly dentistId: string | null;
  readonly date: string;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly reason: string;
  readonly note: string | null;
  readonly dentistName?: string;
}

export function BlockTimePanel({
  dentists,
  blocks,
  defaultDate,
}: {
  readonly dentists: readonly { id: string; name: string }[];
  readonly blocks: readonly BlockRow[];
  readonly defaultDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dentistId, setDentistId] = useState<string>('');
  const [date, setDate] = useState(defaultDate);
  const [untilDate, setUntilDate] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState('13:00');
  const [end, setEnd] = useState('17:00');
  const [reason, setReason] = useState<Reason>('leave');
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{
    message: string;
    affected: string[];
  } | null>(null);

  function toMinutes(value: string): number {
    const [h, m] = value.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  async function submit(force: boolean) {
    setWorking(true);
    setError(null);
    if (force) setConflict(null);

    try {
      const response = await fetch('/api/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dentistId: dentistId || null,
          date,
          untilDate: untilDate || undefined,
          allDay,
          startMinutes: allDay ? undefined : toMinutes(start),
          endMinutes: allDay ? undefined : toMinutes(end),
          reason,
          note: note.trim() || undefined,
          force,
        }),
      });

      if (response.status === 409) {
        const body = (await response.json()) as {
          error?: { message?: string; fieldErrors?: Record<string, string[]> };
        };
        setConflict({
          message: body.error?.message ?? 'That period has booked appointments in it.',
          affected: body.error?.fieldErrors?.affected ?? [],
        });
        return;
      }

      if (!response.ok) {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setError(body.error?.message ?? 'That period could not be blocked.');
        return;
      }

      setOpen(false);
      setNote('');
      setUntilDate('');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  async function removeBlock(id: string) {
    setWorking(true);
    try {
      await fetch(`/api/admin/blocks/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  const inputClasses =
    'h-9 w-full rounded-panel border border-line-dark bg-white/[0.06] px-2.5 ' +
    'text-[0.8125rem] text-white focus:border-blue focus:outline-none';

  return (
    <section
      className="rounded-card border border-line-dark bg-white/[0.02] p-4"
      aria-labelledby="blocks-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="blocks-heading"
          className="flex items-center gap-2 text-[0.9375rem] font-semibold text-white"
        >
          <Ban className="size-4 text-white/50" aria-hidden="true" />
          Blocked time
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="block-form"
          className="flex h-8 items-center gap-1.5 rounded-panel border border-line-dark px-2.5 text-[0.75rem] font-medium text-white/70 transition-colors duration-[--duration-feedback] hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {open ? 'Close' : 'Block'}
        </button>
      </div>

      {open && (
        <div id="block-form" className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.75rem] font-medium text-white/70">
              Who
            </span>
            <select
              value={dentistId}
              onChange={(event) => setDentistId(event.target.value)}
              className={inputClasses}
            >
              <option value="">Whole practice</option>
              {dentists.map((dentist) => (
                <option key={dentist.id} value={dentist.id}>
                  {dentist.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.75rem] font-medium text-white/70">
                From date
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={inputClasses}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.75rem] font-medium text-white/70">
                Until date
              </span>
              <input
                type="date"
                value={untilDate}
                onChange={(event) => setUntilDate(event.target.value)}
                className={inputClasses}
              />
            </label>
          </div>

          <label className="flex items-center gap-2.5 text-[0.8125rem] text-white/80">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(event) => setAllDay(event.target.checked)}
              className="size-4 accent-blue"
            />
            All day
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.75rem] font-medium text-white/70">
                  Start
                </span>
                <input
                  type="time"
                  step={900}
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className={inputClasses}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.75rem] font-medium text-white/70">
                  End
                </span>
                <input
                  type="time"
                  step={900}
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className={inputClasses}
                />
              </label>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.75rem] font-medium text-white/70">
              Reason
            </span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as Reason)}
              className={inputClasses}
            >
              {BlockReason.values.map((value) => (
                <option key={value} value={value}>
                  {BLOCK_REASON_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.75rem] font-medium text-white/70">
              Note
            </span>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional"
              className={inputClasses}
            />
          </label>

          {error && (
            <p role="alert" className="text-[0.75rem] text-[#ff9c93]">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={working}
            onClick={() => void submit(false)}
            className="flex h-10 items-center justify-center rounded-panel bg-white text-[0.8125rem] font-semibold text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Block this time
          </button>
        </div>
      )}

      {/* Existing blocks in view */}
      {blocks.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-line-dark pt-4">
          {blocks.map((block) => (
            <li
              key={`${block.id}-${block.date}`}
              className="flex items-start justify-between gap-3 rounded-panel bg-white/[0.04] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-medium text-white">
                  {BLOCK_REASON_LABELS[block.reason as Reason] ?? block.reason}
                </p>
                <p className="mt-0.5 text-[0.75rem] tabular-nums text-white/50">
                  {block.endMinutes - block.startMinutes >= 1440
                    ? 'All day'
                    : `${formatLocalMinutes(block.startMinutes)} to ${formatLocalMinutes(block.endMinutes)}`}
                  {' · '}
                  {block.dentistName ?? 'Whole practice'}
                </p>
                {block.note && (
                  <p className="mt-0.5 truncate text-[0.75rem] text-white/40">
                    {block.note}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={working}
                onClick={() => void removeBlock(block.id)}
                aria-label="Unblock this period"
                className="flex size-8 shrink-0 items-center justify-center rounded-panel text-white/40 transition-colors duration-[--duration-feedback] hover:bg-[--color-critical]/15 hover:text-[#ff9c93] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Conflict confirmation */}
      <AlertDialog.Root
        open={conflict !== null}
        onOpenChange={(isOpen) => !isOpen && setConflict(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-overlay min-h-dvh bg-black/60 transition-opacity duration-[--duration-feedback] data-starting-style:opacity-0 data-ending-style:opacity-0" />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-modal w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line-dark bg-charcoal p-6 transition-[opacity,transform] duration-[--duration-feedback] ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0">
            <AlertDialog.Title className="flex items-center gap-2.5 text-[1.0625rem] font-semibold text-white">
              <AlertTriangle
                className="size-5 shrink-0 text-[#fdb022]"
                aria-hidden="true"
              />
              Booked appointments in that period
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-white/65">
              {conflict?.message}
            </AlertDialog.Description>

            {conflict && conflict.affected.length > 0 && (
              <ul className="mt-4 max-h-48 overflow-y-auto rounded-panel bg-white/[0.05] p-3">
                {conflict.affected.map((line) => (
                  <li
                    key={line}
                    className="py-1 text-[0.8125rem] tabular-nums text-white/80"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-[0.8125rem] leading-relaxed text-white/55">
              Blocking will not cancel these appointments. They stay in the
              diary with a note for follow-up, so somebody still needs to
              telephone each patient.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Close className="inline-flex h-11 items-center justify-center rounded-panel border border-line-dark-strong px-5 text-sm font-medium text-white transition-colors duration-[--duration-feedback] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Do not block
              </AlertDialog.Close>
              <AlertDialog.Close
                onClick={() => void submit(true)}
                className={cn(
                  'inline-flex h-11 items-center justify-center rounded-panel px-5',
                  'bg-[--color-caution] text-sm font-semibold text-white',
                  'transition-[filter] duration-[--duration-feedback] hover:brightness-110',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                )}
              >
                Block anyway
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}
