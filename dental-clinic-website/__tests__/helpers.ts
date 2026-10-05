import type {
  AvailabilityInput,
  DayOfWeek,
  DentistDayInput,
  Interval,
} from '@/lib/availability/types';

/** 'HH:MM' to minutes from local midnight. Keeps the tests readable. */
export function m(hhmm: string): number {
  const [h, min] = hhmm.split(':').map(Number);
  return h! * 60 + min!;
}

/** "09:30-10:00" to a half-open interval. */
export function iv(range: string): Interval {
  const [start, end] = range.split('-');
  return { start: m(start!), end: m(end!) };
}

export function dentist(
  id: string,
  overrides: Partial<DentistDayInput> = {},
): DentistDayInput {
  return {
    dentistId: id,
    sortOrder: 100,
    workingWindows: [iv('08:00-17:00')],
    breaks: [],
    busy: [],
    blocks: [],
    ...overrides,
  };
}

export function input(
  overrides: Partial<AvailabilityInput> = {},
): AvailabilityInput {
  return {
    date: '2026-10-08',
    dayOfWeek: 4 as DayOfWeek,
    clinicHours: iv('08:00-17:00'),
    dentists: [dentist('d1')],
    serviceDurationMinutes: 30,
    bufferAfterMinutes: 0,
    granularityMinutes: 15,
    dayPosition: 'future',
    nowLocalMinutes: null,
    minimumLeadTimeMinutes: 0,
    ...overrides,
  };
}

/**
 * An input representing today, where the clock constrains availability.
 * Setting nowLocalMinutes alone is not enough: dayPosition is what tells the
 * engine the clock is relevant at all.
 */
export function todayInput(
  nowLocalMinutes: number,
  overrides: Partial<AvailabilityInput> = {},
): AvailabilityInput {
  return input({ dayPosition: 'today', nowLocalMinutes, ...overrides });
}

/** Slot start times rendered as 'HH:MM', for legible assertions. */
export function startTimes(slots: readonly { startMinutes: number }[]): string[] {
  return slots.map((s) => {
    const h = Math.floor(s.startMinutes / 60);
    const min = s.startMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  });
}
