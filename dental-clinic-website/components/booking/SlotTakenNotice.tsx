'use client';

import { ArrowRight, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import type { SlotDto } from '@/types';

/**
 * Shown when the chosen slot was taken between being displayed and being
 * confirmed.
 *
 * This is the recovery path for the race the booking transaction is designed
 * to catch, and it matters that it is not just an error message. The
 * alternatives below were recomputed at the moment of failure, so they are
 * genuinely still free, and each one is a single click away from completing
 * the booking that just failed.
 *
 * role="alert" so the message is announced immediately: the patient pressed
 * confirm and something changed, which is exactly the case assertive
 * announcement exists for.
 */
export function SlotTakenNotice({
  message,
  alternatives,
  onChoose,
  onPickAnother,
  className,
}: {
  readonly message: string;
  readonly alternatives: readonly SlotDto[];
  readonly onChoose: (slot: SlotDto) => void;
  readonly onPickAnother: () => void;
  readonly className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-card border border-[--color-caution] bg-[--color-caution-soft] p-5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-panel bg-white text-[--color-caution]">
          <CalendarClock className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[0.9375rem] font-semibold text-[--color-caution]">
            {message}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[--color-caution]">
            Your details are still filled in. Pick one of these and confirm
            again.
          </p>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-2">
        {alternatives.map((slot) => (
          <li key={`${slot.date}-${slot.startMinutes}-${slot.dentistId}`}>
            <button
              type="button"
              onClick={() => onChoose(slot)}
              className={cn(
                'group flex w-full items-center justify-between gap-4 rounded-panel',
                'border border-line-strong bg-white px-4 py-3 text-left',
                'transition-[border-color,background-color] duration-[--duration-feedback] ease-out',
                'hover:border-blue hover:bg-blue-soft',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
              )}
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-ink">
                  {new Date(`${slot.date}T12:00:00`).toLocaleDateString(
                    'en-ZA',
                    { weekday: 'long', day: 'numeric', month: 'long' },
                  )}
                </span>
                <span className="truncate text-xs text-grey-strong">
                  with {slot.dentistName}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[1.0625rem] font-semibold tabular-nums text-ink">
                  {slot.startLabel}
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-grey transition-transform duration-[--duration-feedback] ease-out group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Button variant="secondary" className="mt-4" onClick={onPickAnother}>
        Choose a different day
      </Button>
    </div>
  );
}
