'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BOOKING_STEPS, type BookingStep } from '@/hooks/useBookingState';

/**
 * Booking progress.
 *
 * Completed steps are clickable so the patient can go back and change
 * something without losing the rest, which is the whole point of holding the
 * flow in the URL. Steps ahead of the current one are not links, because they
 * are not reachable yet.
 *
 * Marked up as an ordered list with the current step carrying aria-current, so
 * a screen reader reports "step 3 of 5" rather than a row of unexplained
 * numbers.
 */
export function StepIndicator({
  current,
  furthestReached,
  onStepClick,
}: {
  readonly current: BookingStep;
  readonly furthestReached: BookingStep;
  readonly onStepClick: (step: BookingStep) => void;
}) {
  const ids = BOOKING_STEPS.map((s) => s.id);
  const currentIndex = ids.indexOf(current);
  const furthestIndex = ids.indexOf(furthestReached);

  return (
    <nav aria-label="Booking progress">
      <ol className="flex items-center gap-1 sm:gap-2">
        {BOOKING_STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const reachable = index <= furthestIndex;

          const content = (
            <>
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  'text-[0.6875rem] font-semibold tabular-nums',
                  'transition-colors duration-[--duration-feedback] ease-out',
                  active
                    ? 'bg-blue text-white'
                    : done
                      ? 'bg-ink text-white'
                      : 'bg-canvas-deep text-grey-strong',
                )}
              >
                {done ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  'hidden text-[0.8125rem] font-medium sm:inline',
                  active ? 'text-ink' : done ? 'text-charcoal' : 'text-grey',
                )}
              >
                {step.label}
              </span>
            </>
          );

          return (
            <li key={step.id} className="flex min-w-0 items-center gap-1 sm:gap-2">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-px w-3 shrink-0 sm:w-6',
                    index <= currentIndex ? 'bg-ink' : 'bg-line-strong',
                  )}
                />
              )}
              {reachable && !active ? (
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className="flex items-center gap-2 rounded-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                >
                  <span className="sr-only">
                    Go back to step {index + 1}:{' '}
                  </span>
                  {content}
                </button>
              ) : (
                <span
                  aria-current={active ? 'step' : undefined}
                  className="flex items-center gap-2"
                >
                  <span className="sr-only">
                    Step {index + 1} of {BOOKING_STEPS.length}:{' '}
                  </span>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
