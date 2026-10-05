/**
 * The availability engine core. Pure, deterministic, and free of any I/O,
 * Prisma import, Date construction or timezone library. Given the same input it
 * always produces the same output, which is what makes the rules below
 * testable in isolation from the database.
 */
import type {
  AvailabilityInput,
  DayAvailability,
  DentistDayInput,
  Interval,
  LocalMinutes,
  Slot,
} from './types';
import {
  ceilToGrid,
  clampToWindow,
  contains,
  isFullyCovered,
  overlapsAny,
  totalMinutes,
} from './overlap';

/**
 * Compute every bookable slot for one day.
 *
 * A candidate start time survives only if all three rules hold:
 *
 *   Rule A  the whole reserved interval [start, start + duration + buffer)
 *           fits inside the dentist's working window for that day, itself
 *           already clipped to clinic opening hours.
 *   Rule B  the reserved interval overlaps no existing appointment, no
 *           recurring break such as lunch, and no blocked period such as leave.
 *   Rule C  the start is at or after now plus the minimum lead time, which
 *           only constrains today.
 */
export function computeSlots(input: AvailabilityInput): DayAvailability {
  const { date, clinicHours, granularityMinutes } = input;

  // The day has already passed. Checked first, because no other rule matters
  // for a date nobody can be booked into.
  if (input.dayPosition === 'past') {
    return { date, slots: [], unavailableReason: 'all_slots_in_past' };
  }

  // The clinic is closed on this weekday, so nothing else matters.
  if (clinicHours === null) {
    return { date, slots: [], unavailableReason: 'clinic_closed' };
  }

  // No dentist in the practice is eligible to perform this service.
  if (input.dentists.length === 0) {
    return { date, slots: [], unavailableReason: 'no_eligible_dentist' };
  }

  // Earliest permitted start. Only today is constrained by the clock, and the
  // cutoff is rounded up to the grid so an awkward "now" of 09:07 produces
  // 09:15 rather than an off-grid 09:07.
  const earliestStart: LocalMinutes =
    input.dayPosition === 'today' && input.nowLocalMinutes !== null
      ? ceilToGrid(
          input.nowLocalMinutes + input.minimumLeadTimeMinutes,
          granularityMinutes,
        )
      : Number.NEGATIVE_INFINITY;

  // Candidate start time -> the eligible dentists who are free at that time.
  // Grouping by start time is what makes "any available dentist" cheap and
  // lets a slot carry its own fallback list.
  const byStart = new Map<LocalMinutes, DentistDayInput[]>();
  let anyDentistWorked = false;
  let suppressedOnlyByLeadTime = false;

  for (const dentist of input.dentists) {
    const duration =
      dentist.durationMinutesOverride ?? input.serviceDurationMinutes;
    // What must actually be held in the diary, including turnaround.
    const reservedLength = duration + input.bufferAfterMinutes;

    // A dentist rostered 07:00 to 17:00 at a clinic open 08:00 to 17:00 can
    // only be booked from 08:00, so every window is clipped to clinic hours.
    const windows = dentist.workingWindows
      .map((w) => clampToWindow(w, clinicHours))
      .filter((w): w is Interval => w !== null);

    if (windows.length > 0) anyDentistWorked = true;

    const conflicts: Interval[] = [
      ...dentist.breaks,
      ...dentist.busy,
      ...dentist.blocks,
    ];

    for (const window of windows) {
      // Anchor the grid to the start of the working window rather than to
      // midnight, so the first candidate is always exactly the opening time
      // even if hours are ever something awkward like 08:10.
      const first = ceilToGrid(window.start, granularityMinutes, window.start);

      for (
        let start = first;
        start + reservedLength <= window.end;
        start += granularityMinutes
      ) {
        const reserved: Interval = { start, end: start + reservedLength };

        // Rule A. The loop bound already guarantees this; the explicit check
        // documents the invariant and protects against a future edit.
        if (!contains(window, reserved)) continue;

        // Rule B.
        if (overlapsAny(reserved, conflicts)) continue;

        // Rule C.
        if (start < earliestStart) {
          suppressedOnlyByLeadTime = true;
          continue;
        }

        const bucket = byStart.get(start);
        if (bucket) {
          bucket.push(dentist);
        } else {
          byStart.set(start, [dentist]);
        }
      }
    }
  }

  if (!anyDentistWorked) {
    return { date, slots: [], unavailableReason: 'no_dentist_working' };
  }

  // Day load per dentist, computed once from the same snapshot used for the
  // overlap checks so that a single request is internally consistent.
  const loadByDentist = new Map<string, number>(
    input.dentists.map((d) => [
      d.dentistId,
      totalMinutes([...d.busy, ...d.blocks]),
    ]),
  );

  const slots: Slot[] = [...byStart.entries()]
    .sort(([a], [b]) => a - b)
    .map(([startMinutes, candidates]) => {
      const ordered = [...candidates].sort(compareDentists(loadByDentist));
      const chosen = ordered[0]!;
      const duration =
        chosen.durationMinutesOverride ?? input.serviceDurationMinutes;
      return {
        date,
        startMinutes,
        endMinutes: startMinutes + duration,
        dentistId: chosen.dentistId,
        alternateDentistIds: ordered.slice(1).map((d) => d.dentistId),
      };
    });

  if (slots.length === 0) {
    return {
      date,
      slots: [],
      unavailableReason: suppressedOnlyByLeadTime
        ? 'all_slots_in_past'
        : // Every dentist who works today has their whole window blocked off,
          // so this is a closure rather than a full diary.
          everyWindowBlocked(input, clinicHours)
          ? 'blocked'
          : 'fully_booked',
    };
  }

  return { date, slots, unavailableReason: null };
}

/**
 * Whether every working minute of every rostered dentist is blocked off.
 *
 * Only consulted when a day produced no slots, to choose between "the practice
 * is closed" and "every appointment has gone".
 */
function everyWindowBlocked(
  input: AvailabilityInput,
  clinicHours: Interval,
): boolean {
  let sawWindow = false;
  for (const dentist of input.dentists) {
    for (const raw of dentist.workingWindows) {
      const window = clampToWindow(raw, clinicHours);
      if (!window) continue;
      sawWindow = true;
      if (!isFullyCovered(window, dentist.blocks)) return false;
    }
  }
  return sawWindow;
}

/**
 * Deterministic ordering of the dentists free at a given candidate time.
 *
 * Documented because tests assert on it and because reception staff need to be
 * able to answer "why was I given Dr Naidoo?".
 *
 *   1. Least loaded that day, by occupied minutes ascending. This spreads work
 *      across the roster instead of always filling the first dentist, and a
 *      dentist on half-day leave is correctly treated as already loaded.
 *   2. sortOrder ascending, the practice's own preference order.
 *   3. dentistId ascending, guaranteeing a total order. No randomness, no
 *      dependence on Map iteration order, no dependence on the clock.
 */
function compareDentists(load: Map<string, number>) {
  return (a: DentistDayInput, b: DentistDayInput): number =>
    (load.get(a.dentistId) ?? 0) - (load.get(b.dentistId) ?? 0) ||
    a.sortOrder - b.sortOrder ||
    a.dentistId.localeCompare(b.dentistId);
}

/** Resolve which eligible dentist should take a slot at a specific time. */
export function resolveDentistForSlot(
  input: AvailabilityInput,
  startMinutes: LocalMinutes,
): Slot | null {
  const day = computeSlots(input);
  return day.slots.find((s) => s.startMinutes === startMinutes) ?? null;
}
