'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarX2, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { SlotGridSkeleton } from '@/components/ui/Primitives';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { track } from '@/lib/analytics';
import type { DayAvailabilityDto, SlotDto } from '@/types';

/**
 * Choosing a date and a time.
 *
 * Two things here are what make the booking flow feel like it knows something:
 *
 * 1. The calendar disables days that genuinely have nothing free, computed
 *    from the engine rather than guessed from opening hours, so a patient
 *    never clicks a day only to be told it is full.
 *
 * 2. An empty day never says "no availability" and stop. It says which day it
 *    is and why, then offers the real next available times with a button to
 *    jump straight to that day. That is the difference between a dead end and
 *    a booking.
 */

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

interface RangeResponse {
  readonly availableDates: readonly string[];
  readonly slotCountByDate: Readonly<Record<string, number>>;
}

export function DateTimeStep({
  serviceSlug,
  dentistId,
  date,
  time,
  onSelectDate,
  onSelectTime,
  onContinue,
}: {
  readonly serviceSlug: string;
  readonly dentistId: string;
  readonly date: string | null;
  readonly time: number | null;
  readonly onSelectDate: (date: string) => void;
  readonly onSelectTime: (minutes: number) => void;
  readonly onContinue: () => void;
}) {
  const [month, setMonth] = useState<Date>(() =>
    date ? fromKey(date) : new Date(),
  );

  /**
   * Fetched data is stored tagged with the request it answered, so "is this
   * loading" is derived at render by comparing the tag against what is
   * currently wanted. That removes a separate loading flag, and with it the
   * setState call at the top of each effect that would otherwise cause a
   * cascading render on every month change.
   */
  const rangeKey = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = first < today ? today : first;
    return `${toKey(start)}|${serviceSlug}|${dentistId}`;
  }, [month, serviceSlug, dentistId]);

  const dayKey = date ? `${date}|${serviceSlug}|${dentistId}` : null;

  const [range, setRange] = useState<{ key: string; data: RangeResponse } | null>(
    null,
  );
  const [day, setDay] = useState<{
    key: string;
    data: DayAvailabilityDto | null;
  } | null>(null);

  const rangeLoading = range?.key !== rangeKey;
  const dayLoading = dayKey !== null && day?.key !== dayKey;

  /* -------- Per-month slot counts, for shading the calendar -------- */
  useEffect(() => {
    const controller = new AbortController();
    const [from] = rangeKey.split('|');

    const params = new URLSearchParams({
      from: from!,
      // Six weeks, which covers a month grid plus its leading and trailing days.
      days: '42',
      service: serviceSlug,
      dentist: dentistId,
    });

    fetch(`/api/availability/range?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((r) => (r.ok ? (r.json() as Promise<RangeResponse>) : null))
      .then((data) => {
        setRange({
          key: rangeKey,
          data: data ?? { availableDates: [], slotCountByDate: {} },
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // Settle the key so the calendar stops showing a loading state. With
        // no counts, only out-of-range dates are disabled.
        setRange({
          key: rangeKey,
          data: { availableDates: [], slotCountByDate: {} },
        });
      });

    return () => controller.abort();
  }, [rangeKey, serviceSlug, dentistId]);

  /* -------- Times for the chosen day -------- */
  useEffect(() => {
    if (dayKey === null || !date) return;
    const controller = new AbortController();

    const params = new URLSearchParams({
      date,
      service: serviceSlug,
      dentist: dentistId,
    });

    fetch(`/api/availability?${params.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((r) => (r.ok ? (r.json() as Promise<DayAvailabilityDto>) : null))
      .then((data) => setDay({ key: dayKey, data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setDay({ key: dayKey, data: null });
      });

    return () => controller.abort();
  }, [dayKey, date, serviceSlug, dentistId]);

  // The loaded day, or null while a different day is still in flight.
  const dayData = day?.key === dayKey ? day.data : null;

  const handleSelectDate = useCallback(
    (picked: Date | undefined) => {
      if (!picked) return;
      const key = toKey(picked);
      onSelectDate(key);
      track({ name: 'date_selected', date: key });
    },
    [onSelectDate],
  );

  const handleJumpTo = useCallback(
    (slot: SlotDto) => {
      onSelectDate(slot.date);
      setMonth(fromKey(slot.date));
      track({ name: 'date_selected', date: slot.date });
    },
    [onSelectDate],
  );

  const selectedDate = useMemo(() => (date ? fromKey(date) : undefined), [date]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12">
      {/* ---------------- Calendar ---------------- */}
      <div>
        <h2 className="text-[1.0625rem] font-semibold text-ink">
          Choose a date
        </h2>
        <p className="mt-1 text-sm text-grey-strong">
          Days without a dot have nothing available.
        </p>
        <div className="mt-5 rounded-card border border-line bg-white p-4">
          <AvailabilityCalendar
            selected={selectedDate}
            onSelect={handleSelectDate}
            month={month}
            onMonthChange={setMonth}
            slotCountByDate={range?.data.slotCountByDate ?? {}}
            loading={rangeLoading}
          />
        </div>
      </div>

      {/* ---------------- Times ---------------- */}
      <div>
        <h2 className="text-[1.0625rem] font-semibold text-ink">
          {dayData && dayData.slots.length > 0
            ? `Available on ${dayData.weekday}`
            : 'Choose a time'}
        </h2>
        <p className="mt-1 text-sm text-grey-strong">
          {date
            ? dayData?.dateLabel ?? 'Loading available times'
            : 'Pick a date to see available times.'}
        </p>

        <div className="mt-5" aria-live="polite">
          {!date ? (
            <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-canvas px-6 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-white text-grey-strong">
                <Clock className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-grey-strong">
                Select a date on the calendar.
              </p>
            </div>
          ) : dayLoading ? (
            <SlotGridSkeleton />
          ) : dayData && dayData.slots.length > 0 ? (
            <>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {dayData.slots.map((slot) => {
                  const active = time === slot.startMinutes;
                  return (
                    <li key={slot.startMinutes}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          onSelectTime(slot.startMinutes);
                          track({
                            name: 'time_selected',
                            date: slot.date,
                            startMinutes: slot.startMinutes,
                          });
                        }}
                        className={cn(
                          'h-11 w-full rounded-panel border text-sm font-medium tabular-nums',
                          'transition-[background-color,border-color,color]',
                          'duration-[--duration-feedback] ease-out',
                          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
                          active
                            ? 'border-blue bg-blue text-white'
                            : 'border-line-strong bg-white text-ink hover:border-blue hover:text-blue',
                        )}
                      >
                        {slot.startLabel}
                        <span className="sr-only">
                          {' '}
                          to {slot.endLabel} with {slot.dentistName}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {time !== null && (
                <div className="mt-6 flex flex-col gap-3 rounded-card border border-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-charcoal">
                    <span className="font-medium">
                      {dayData.slots.find((s) => s.startMinutes === time)?.startLabel}
                    </span>{' '}
                    on {dayData.dateLabel}, with{' '}
                    {dayData.slots.find((s) => s.startMinutes === time)?.dentistName}
                  </p>
                  <Button onClick={onContinue} className="shrink-0">
                    Continue
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* The smart fallback. Never a bare "no availability". */
            <div className="rounded-card border border-line bg-canvas p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-panel bg-white text-grey-strong">
                  <CalendarX2 className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.9375rem] font-semibold text-ink">
                    {dayData?.unavailableMessage ??
                      'No appointments are available on that day.'}
                  </p>
                  {dayData && dayData.nextAvailable.length > 0 && (
                    <p className="mt-1 text-sm text-grey-strong">
                      Here is the next availability.
                    </p>
                  )}
                </div>
              </div>

              {dayData && dayData.nextAvailable.length > 0 ? (
                <ul className="mt-5 flex flex-col gap-2">
                  {dayData.nextAvailable.map((slot) => (
                    <li key={`${slot.date}-${slot.startMinutes}`}>
                      <button
                        type="button"
                        onClick={() => handleJumpTo(slot)}
                        className={cn(
                          'group flex w-full items-center justify-between gap-4 rounded-panel',
                          'border border-line-strong bg-white px-4 py-3 text-left',
                          'transition-[border-color,background-color]',
                          'duration-[--duration-feedback] ease-out',
                          'hover:border-blue hover:bg-blue-soft',
                          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
                        )}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="text-sm font-medium text-ink">
                            {new Date(
                              `${slot.date}T12:00:00`,
                            ).toLocaleDateString('en-ZA', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
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
              ) : (
                <div className="mt-5 flex items-start gap-2.5 rounded-panel bg-white p-4">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-grey"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-grey-strong">
                    Nothing is available online for this appointment type at the
                    moment. Please phone reception and we will find you a time.
                  </p>
                </div>
              )}

              {dayData && dayData.nextAvailable.length > 0 && (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => handleJumpTo(dayData.nextAvailable[0]!)}
                >
                  View{' '}
                  {new Date(
                    `${dayData.nextAvailable[0]!.date}T12:00:00`,
                  ).toLocaleDateString('en-ZA', { weekday: 'long' })}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
