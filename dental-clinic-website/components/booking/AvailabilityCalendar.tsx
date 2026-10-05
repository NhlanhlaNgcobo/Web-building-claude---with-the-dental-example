'use client';

import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The booking calendar.
 *
 * Built on react-day-picker, which supplies the ARIA grid, the arrow key
 * navigation, the month roving focus and the disabled-day handling. That
 * behaviour is subtle enough that reimplementing it is how accessible date
 * pickers usually get broken, so it is not reimplemented here. Every visual
 * decision below is ours; none of the keyboard behaviour is.
 *
 * Availability is never communicated by colour alone. An available day gets a
 * dot beneath the number as well as its colour, an unavailable day is dimmed
 * and struck through, and each day carries a full spoken label such as
 * "Thursday 8 October, 6 appointments available".
 */

export interface CalendarProps {
  readonly selected: Date | undefined;
  readonly onSelect: (date: Date | undefined) => void;
  readonly month: Date;
  readonly onMonthChange: (month: Date) => void;
  /** Slot counts keyed by 'YYYY-MM-DD'. A missing or zero entry is unavailable. */
  readonly slotCountByDate: Readonly<Record<string, number>>;
  readonly loading?: boolean;
  readonly className?: string;
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function AvailabilityCalendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  slotCountByDate,
  loading = false,
  className,
}: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 120);

  function countFor(date: Date): number {
    return slotCountByDate[toKey(date)] ?? 0;
  }

  function isUnavailable(date: Date): boolean {
    const atMidnight = new Date(date);
    atMidnight.setHours(0, 0, 0, 0);
    if (atMidnight < today) return true;
    if (atMidnight > horizon) return true;
    // While counts are loading, nothing is disabled on the basis of a count we
    // do not have yet; only genuinely out-of-range dates are blocked.
    if (loading) return false;
    return countFor(date) === 0;
  }

  return (
    <div
      className={cn('relative', className)}
      aria-busy={loading || undefined}
    >
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        startMonth={new Date(today.getFullYear(), today.getMonth(), 1)}
        endMonth={new Date(horizon.getFullYear(), horizon.getMonth(), 1)}
        disabled={isUnavailable}
        weekStartsOn={1}
        showOutsideDays={false}
        fixedWeeks
        components={{
          Chevron: ({ orientation, ...props }) =>
            orientation === 'left' ? (
              <ChevronLeft className="size-4" {...props} />
            ) : (
              <ChevronRight className="size-4" {...props} />
            ),
          DayButton: ({ day, modifiers, ...props }) => {
            const count = countFor(day.date);
            const available = !modifiers.disabled && count > 0;
            return (
              <button
                {...props}
                className={cn(
                  'relative flex size-full flex-col items-center justify-center gap-1 rounded-panel',
                  'text-sm tabular-nums',
                  'transition-colors duration-[--duration-feedback] ease-out',
                  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue',
                  modifiers.selected
                    ? 'bg-blue font-semibold text-white'
                    : modifiers.disabled
                      ? 'text-grey-light line-through decoration-grey-light/70'
                      : 'font-medium text-ink hover:bg-blue-soft',
                  modifiers.today && !modifiers.selected && 'ring-1 ring-inset ring-ink',
                )}
              >
                <span>{day.date.getDate()}</span>
                {/* The non-colour availability marker. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-1 rounded-full',
                    available
                      ? modifiers.selected
                        ? 'bg-white'
                        : 'bg-blue'
                      : 'bg-transparent',
                  )}
                />
              </button>
            );
          },
        }}
        labels={{
          labelDayButton: (date, modifiers) => {
            const spoken = date.toLocaleDateString('en-ZA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            });
            if (modifiers.disabled) return `${spoken}, no appointments available`;
            const count = countFor(date);
            return `${spoken}, ${count} ${count === 1 ? 'appointment' : 'appointments'} available`;
          },
        }}
        classNames={{
          root: 'w-full',
          months: 'w-full',
          month: 'w-full',
          month_caption: 'flex h-10 items-center justify-center',
          caption_label: 'text-[0.9375rem] font-semibold text-ink',
          nav: 'absolute inset-x-0 top-0 flex h-10 items-center justify-between',
          button_previous:
            'flex size-9 items-center justify-center rounded-panel text-charcoal transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
          button_next:
            'flex size-9 items-center justify-center rounded-panel text-charcoal transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
          month_grid: 'mt-3 w-full border-collapse',
          weekdays: 'flex',
          weekday:
            'flex-1 pb-2 text-center text-[0.6875rem] font-semibold uppercase text-grey-strong',
          weeks: '',
          week: 'flex w-full',
          day: 'flex-1 p-0.5 aspect-square',
          outside: 'invisible',
        }}
      />

      {/* Legend, because the dot needs explaining once. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-grey-strong">
        <span className="flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-blue" aria-hidden="true" />
          Appointments available
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="text-grey-light line-through decoration-grey-light/70"
            aria-hidden="true"
          >
            00
          </span>
          Fully booked or closed
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="rounded-sm px-1 ring-1 ring-inset ring-ink"
            aria-hidden="true"
          >
            00
          </span>
          Today
        </span>
      </div>
    </div>
  );
}
