'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * Booking wizard state, held in the URL.
 *
 * The query string is the single source of truth, which solves the abandonment
 * problem outright rather than patching over it: going back does not reset the
 * flow, a half-finished booking can be reloaded or shared, and the browser's
 * own back button behaves the way the patient expects. There is no effect
 * synchronising a parallel copy of this in component state, because there is
 * no parallel copy.
 */

export type BookingStep =
  | 'service'
  | 'dentist'
  | 'time'
  | 'details'
  | 'payment';

export const BOOKING_STEPS: readonly {
  readonly id: BookingStep;
  readonly label: string;
}[] = [
  { id: 'service', label: 'Treatment' },
  { id: 'dentist', label: 'Dentist' },
  { id: 'time', label: 'Date & time' },
  { id: 'details', label: 'Your details' },
  { id: 'payment', label: 'Confirm' },
];

export interface BookingState {
  readonly step: BookingStep;
  readonly service: string | null;
  readonly dentist: string;
  readonly date: string | null;
  /** Minutes from local midnight, as a number. */
  readonly time: number | null;
}

function isStep(value: string | null): value is BookingStep {
  return (
    value === 'service' ||
    value === 'dentist' ||
    value === 'time' ||
    value === 'details' ||
    value === 'payment'
  );
}

export function useBookingState() {
  const router = useRouter();
  const params = useSearchParams();

  const state = useMemo<BookingState>(() => {
    const service = params.get('service');
    const dentist = params.get('dentist') ?? 'any';
    const date = params.get('date');
    const rawTime = params.get('time');
    const time = rawTime !== null && /^\d+$/.test(rawTime) ? Number(rawTime) : null;
    const requested = params.get('step');

    // Derive the furthest step the current selections can actually support,
    // so a hand-edited or stale URL cannot land on a step with nothing behind
    // it. This is computed at render rather than corrected by an effect.
    const furthest: BookingStep = !service
      ? 'service'
      : date === null || time === null
        ? 'time'
        : 'payment';

    const order: BookingStep[] = ['service', 'dentist', 'time', 'details', 'payment'];
    const wanted = isStep(requested) ? requested : furthest;
    const step =
      order.indexOf(wanted) > order.indexOf(furthest) ? furthest : wanted;

    return { step, service, dentist, date, time };
  }, [params]);

  /**
   * Update the URL. Uses replace rather than push for within-step changes so
   * the back button steps through the wizard rather than through every
   * individual date the patient tried.
   */
  const update = useCallback(
    (
      changes: Partial<Record<'step' | 'service' | 'dentist' | 'date' | 'time', string | null>>,
      options: { push?: boolean } = {},
    ) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const url = `/book?${next.toString()}`;
      if (options.push) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [params, router],
  );

  const goToStep = useCallback(
    (step: BookingStep) => update({ step }, { push: true }),
    [update],
  );

  return { state, update, goToStep } as const;
}
