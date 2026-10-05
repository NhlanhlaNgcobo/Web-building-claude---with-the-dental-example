import { describe, expect, it } from 'vitest';
import { computeSlots } from '@/lib/availability/compute';
import { isFullyCovered } from '@/lib/availability/overlap';
import { dentist, input, iv, m, startTimes, todayInput } from './helpers';

describe('the collision case from the specification', () => {
  // An existing appointment runs 10:00 to 10:45. A new 30 minute booking must
  // be rejected at 09:45, 10:00, 10:15 and 10:30 because each of those would
  // overlap it, while 09:30 (which ends exactly at 10:00) and 10:45 stay valid.
  const withExisting = input({
    dentists: [dentist('d1', { busy: [iv('10:00-10:45')] })],
    serviceDurationMinutes: 30,
    granularityMinutes: 15,
  });

  it('blocks every 30 minute start that overlaps 10:00 to 10:45', () => {
    const times = startTimes(computeSlots(withExisting).slots);
    expect(times).not.toContain('09:45');
    expect(times).not.toContain('10:00');
    expect(times).not.toContain('10:15');
    expect(times).not.toContain('10:30');
  });

  it('keeps 09:30 available, because it ends exactly when the appointment starts', () => {
    expect(startTimes(computeSlots(withExisting).slots)).toContain('09:30');
  });

  it('keeps 10:45 available, because it starts exactly when the appointment ends', () => {
    expect(startTimes(computeSlots(withExisting).slots)).toContain('10:45');
  });

  it('offers a contiguous grid either side of the appointment', () => {
    const times = startTimes(computeSlots(withExisting).slots);
    expect(times.slice(0, 7)).toEqual([
      '08:00',
      '08:15',
      '08:30',
      '08:45',
      '09:00',
      '09:15',
      '09:30',
    ]);
    expect(times[7]).toBe('10:45');
  });
});

describe('appointment duration', () => {
  it.each([
    [30, '16:30'],
    [45, '16:15'],
    [60, '16:00'],
    [90, '15:30'],
    [120, '15:00'],
  ])(
    'a %i minute appointment cannot start later than %s against a 17:00 close',
    (duration, lastStart) => {
      const day = computeSlots(input({ serviceDurationMinutes: duration }));
      expect(startTimes(day.slots).at(-1)).toBe(lastStart);
    },
  );

  it('reserves the turnaround buffer as well as the chair time', () => {
    // 45 minutes of chair time plus 15 minutes turnaround needs a full hour,
    // so the last start against a 17:00 close is 16:00, not 16:15.
    const day = computeSlots(
      input({ serviceDurationMinutes: 45, bufferAfterMinutes: 15 }),
    );
    expect(startTimes(day.slots).at(-1)).toBe('16:00');
  });

  it('reports the chair end to the patient, not the buffered end', () => {
    const day = computeSlots(
      input({ serviceDurationMinutes: 45, bufferAfterMinutes: 15 }),
    );
    const first = day.slots[0]!;
    expect(first.startMinutes).toBe(m('08:00'));
    expect(first.endMinutes).toBe(m('08:45'));
  });

  it('a longer appointment cannot squeeze into a gap that fits a shorter one', () => {
    // A single free hour exists between 09:00 and 10:00.
    const busy = [iv('08:00-09:00'), iv('10:00-17:00')];
    expect(
      startTimes(
        computeSlots(
          input({
            dentists: [dentist('d1', { busy })],
            serviceDurationMinutes: 60,
          }),
        ).slots,
      ),
    ).toEqual(['09:00']);
    expect(
      startTimes(
        computeSlots(
          input({
            dentists: [dentist('d1', { busy })],
            serviceDurationMinutes: 90,
          }),
        ).slots,
      ),
    ).toEqual([]);
  });
});

describe('clinic and dentist hours', () => {
  it('returns clinic_closed when the clinic does not open that day', () => {
    const day = computeSlots(input({ clinicHours: null, dayOfWeek: 0 }));
    expect(day.slots).toEqual([]);
    expect(day.unavailableReason).toBe('clinic_closed');
  });

  it('respects the earlier Friday close at 16:00', () => {
    const day = computeSlots(
      input({
        dayOfWeek: 5,
        clinicHours: iv('08:00-16:00'),
        serviceDurationMinutes: 30,
      }),
    );
    expect(startTimes(day.slots).at(-1)).toBe('15:30');
  });

  it('respects the Saturday close at 13:00', () => {
    const day = computeSlots(
      input({
        dayOfWeek: 6,
        clinicHours: iv('08:00-13:00'),
        serviceDurationMinutes: 45,
      }),
    );
    expect(startTimes(day.slots).at(-1)).toBe('12:15');
  });

  it('clips a dentist rostered wider than the clinic down to clinic hours', () => {
    const day = computeSlots(
      input({
        clinicHours: iv('08:00-17:00'),
        dentists: [dentist('d1', { workingWindows: [iv('07:00-19:00')] })],
      }),
    );
    expect(startTimes(day.slots)[0]).toBe('08:00');
    expect(startTimes(day.slots).at(-1)).toBe('16:30');
  });

  it('returns no_dentist_working when nobody is rostered', () => {
    const day = computeSlots(
      input({ dentists: [dentist('d1', { workingWindows: [] })] }),
    );
    expect(day.slots).toEqual([]);
    expect(day.unavailableReason).toBe('no_dentist_working');
  });

  it('returns no_eligible_dentist when no dentist can perform the service', () => {
    const day = computeSlots(input({ dentists: [] }));
    expect(day.slots).toEqual([]);
    expect(day.unavailableReason).toBe('no_eligible_dentist');
  });

  it('supports a split shift as two working windows', () => {
    const day = computeSlots(
      input({
        dentists: [
          dentist('d1', {
            workingWindows: [iv('08:00-10:00'), iv('14:00-16:00')],
          }),
        ],
        serviceDurationMinutes: 60,
      }),
    );
    // Each window is filled on the 15 minute grid up to the last start that
    // still finishes inside it, and the midday gap produces no candidates.
    expect(startTimes(day.slots)).toEqual([
      '08:00',
      '08:15',
      '08:30',
      '08:45',
      '09:00',
      '14:00',
      '14:15',
      '14:30',
      '14:45',
      '15:00',
    ]);
  });
});

describe('breaks, blocks and leave', () => {
  it('does not offer a slot that runs into lunch', () => {
    const day = computeSlots(
      input({
        dentists: [dentist('d1', { breaks: [iv('13:00-14:00')] })],
        serviceDurationMinutes: 30,
      }),
    );
    const times = startTimes(day.slots);
    expect(times).toContain('12:30');
    expect(times).not.toContain('12:45');
    expect(times).not.toContain('13:00');
    expect(times).not.toContain('13:30');
    expect(times).toContain('14:00');
  });

  it('excludes a blocked period such as training', () => {
    const day = computeSlots(
      input({ dentists: [dentist('d1', { blocks: [iv('08:00-12:00')] })] }),
    );
    expect(startTimes(day.slots)[0]).toBe('12:00');
  });

  it('reports a blocked day as blocked, not as fully booked', () => {
    // These mean different things to a patient: one is a closure, the other
    // means every appointment has already gone. The copy differs, so the
    // engine has to tell them apart.
    const day = computeSlots(
      input({ dentists: [dentist('d1', { blocks: [iv('08:00-17:00')] })] }),
    );
    expect(day.slots).toEqual([]);
    expect(day.unavailableReason).toBe('blocked');
  });

  it('reports a diary full of appointments as fully booked', () => {
    const day = computeSlots(
      input({ dentists: [dentist('d1', { busy: [iv('08:00-17:00')] })] }),
    );
    expect(day.slots).toEqual([]);
    expect(day.unavailableReason).toBe('fully_booked');
  });

  it('is only blocked when every dentist is blocked', () => {
    // One dentist blocked, another free, so the day is neither closed nor
    // full: it still has slots.
    const day = computeSlots(
      input({
        dentists: [
          dentist('blocked-one', { blocks: [iv('08:00-17:00')] }),
          dentist('free-one'),
        ],
      }),
    );
    expect(day.slots.length).toBeGreaterThan(0);
    expect(day.slots.every((s) => s.dentistId === 'free-one')).toBe(true);
  });

  it('does not call a partially blocked but booked-out day blocked', () => {
    const day = computeSlots(
      input({
        dentists: [
          dentist('d1', {
            blocks: [iv('08:00-12:00')],
            busy: [iv('12:00-17:00')],
          }),
        ],
      }),
    );
    expect(day.slots).toEqual([]);
    // The block does not cover the whole window, so this is a full diary.
    expect(day.unavailableReason).toBe('fully_booked');
  });

  it('treats a clinic wide block as blocking every dentist', () => {
    const closure = [iv('08:00-17:00')];
    const day = computeSlots(
      input({
        dentists: [
          dentist('d1', { blocks: closure }),
          dentist('d2', { blocks: closure }),
        ],
      }),
    );
    expect(day.slots).toEqual([]);
    expect(day.unavailableReason).toBe('blocked');
  });
});

describe('isFullyCovered', () => {
  it('recognises complete coverage by a single interval', () => {
    expect(isFullyCovered(iv('08:00-17:00'), [iv('08:00-17:00')])).toBe(true);
    expect(isFullyCovered(iv('09:00-12:00'), [iv('08:00-17:00')])).toBe(true);
  });

  it('recognises coverage assembled from adjacent intervals', () => {
    expect(
      isFullyCovered(iv('08:00-17:00'), [iv('08:00-13:00'), iv('13:00-17:00')]),
    ).toBe(true);
  });

  it('rejects a gap in the middle', () => {
    expect(
      isFullyCovered(iv('08:00-17:00'), [iv('08:00-12:00'), iv('13:00-17:00')]),
    ).toBe(false);
  });

  it('rejects partial coverage at either end', () => {
    expect(isFullyCovered(iv('08:00-17:00'), [iv('09:00-17:00')])).toBe(false);
    expect(isFullyCovered(iv('08:00-17:00'), [iv('08:00-16:00')])).toBe(false);
  });

  it('rejects an empty list', () => {
    expect(isFullyCovered(iv('08:00-17:00'), [])).toBe(false);
  });
});

describe('today, lead time and past slots', () => {
  it('hides times that have already passed today', () => {
    const day = computeSlots(todayInput(m('11:20'), { minimumLeadTimeMinutes: 0 }));
    expect(startTimes(day.slots)[0]).toBe('11:30');
  });

  it('applies the minimum lead time on top of the current time', () => {
    const day = computeSlots(
      todayInput(m('09:00'), { minimumLeadTimeMinutes: 120 }),
    );
    expect(startTimes(day.slots)[0]).toBe('11:00');
  });

  it('rounds the lead time cutoff up onto the grid', () => {
    const day = computeSlots(todayInput(m('09:07'), { minimumLeadTimeMinutes: 0 }));
    expect(startTimes(day.slots)[0]).toBe('09:15');
  });

  it('distinguishes a day that has passed from a day that is fully booked', () => {
    const late = computeSlots(todayInput(m('16:50'), { minimumLeadTimeMinutes: 0 }));
    expect(late.slots).toEqual([]);
    expect(late.unavailableReason).toBe('all_slots_in_past');

    const booked = computeSlots(
      input({ dentists: [dentist('d1', { busy: [iv('08:00-17:00')] })] }),
    );
    expect(booked.unavailableReason).toBe('fully_booked');
  });

  it('does not constrain a future date', () => {
    const day = computeSlots(input({ dayPosition: 'future' }));
    expect(startTimes(day.slots)[0]).toBe('08:00');
  });

  it('offers nothing at all on a date that has already passed', () => {
    // A date in the past must never produce slots, whatever the clock says.
    // Treating "not today" as "in the future" would skip the clock entirely
    // and let a booking through for a day that has already been and gone.
    const day = computeSlots(input({ dayPosition: 'past' }));
    expect(day.slots).toEqual([]);
    expect(day.unavailableReason).toBe('all_slots_in_past');
  });

  it('ignores the clock on a past date even when it looks open', () => {
    const day = computeSlots(
      input({ dayPosition: 'past', nowLocalMinutes: m('08:00') }),
    );
    expect(day.slots).toEqual([]);
  });
});

describe('any available dentist', () => {
  it('merges availability across dentists and records fallbacks', () => {
    const day = computeSlots(
      input({
        dentists: [
          dentist('d1', { busy: [iv('08:00-12:00')] }),
          dentist('d2', { busy: [iv('12:00-17:00')] }),
        ],
        serviceDurationMinutes: 60,
      }),
    );
    // Both dentists together cover the full day even though neither does alone.
    expect(startTimes(day.slots)[0]).toBe('08:00');
    expect(startTimes(day.slots).at(-1)).toBe('16:00');
    // At 08:00 only d2 is free, so there is no alternate.
    expect(day.slots[0]!.dentistId).toBe('d2');
    expect(day.slots[0]!.alternateDentistIds).toEqual([]);
  });

  it('prefers the least loaded dentist and lists the others as alternates', () => {
    const day = computeSlots(
      input({
        dentists: [
          dentist('busy-one', { sortOrder: 1, busy: [iv('14:00-17:00')] }),
          dentist('free-one', { sortOrder: 2 }),
        ],
        serviceDurationMinutes: 30,
      }),
    );
    const eight = day.slots.find((s) => s.startMinutes === m('08:00'))!;
    // free-one carries no load, so it wins despite a weaker sortOrder.
    expect(eight.dentistId).toBe('free-one');
    expect(eight.alternateDentistIds).toEqual(['busy-one']);
  });

  it('falls back to sortOrder when load is equal', () => {
    const day = computeSlots(
      input({
        dentists: [
          dentist('second', { sortOrder: 20 }),
          dentist('first', { sortOrder: 10 }),
        ],
      }),
    );
    expect(day.slots[0]!.dentistId).toBe('first');
    expect(day.slots[0]!.alternateDentistIds).toEqual(['second']);
  });

  it('falls back to a stable id order when load and sortOrder are equal', () => {
    const day = computeSlots(
      input({
        dentists: [
          dentist('bbb', { sortOrder: 5 }),
          dentist('aaa', { sortOrder: 5 }),
        ],
      }),
    );
    expect(day.slots[0]!.dentistId).toBe('aaa');
  });

  it('is fully deterministic across repeated runs and input orderings', () => {
    const forwards = input({
      dentists: [
        dentist('d1', { sortOrder: 10, busy: [iv('09:00-10:00')] }),
        dentist('d2', { sortOrder: 10, busy: [iv('11:00-12:00')] }),
        dentist('d3', { sortOrder: 20 }),
      ],
    });
    const backwards = input({ dentists: [...forwards.dentists].reverse() });
    expect(computeSlots(forwards)).toEqual(computeSlots(forwards));
    expect(computeSlots(forwards).slots.map((s) => s.dentistId)).toEqual(
      computeSlots(backwards).slots.map((s) => s.dentistId),
    );
  });

  it('honours a per dentist duration override', () => {
    const day = computeSlots(
      input({
        dentists: [dentist('slow', { durationMinutesOverride: 90 })],
        serviceDurationMinutes: 30,
      }),
    );
    expect(startTimes(day.slots).at(-1)).toBe('15:30');
    expect(day.slots[0]!.endMinutes).toBe(m('09:30'));
  });
});

describe('grid granularity', () => {
  it('surfaces quarter past and quarter to candidates', () => {
    const times = startTimes(computeSlots(input()).slots);
    expect(times).toContain('09:45');
    expect(times).toContain('10:15');
  });

  it('anchors the grid to the start of the working window', () => {
    const day = computeSlots(
      input({
        clinicHours: iv('08:10-17:00'),
        dentists: [dentist('d1', { workingWindows: [iv('08:10-17:00')] })],
      }),
    );
    expect(startTimes(day.slots)[0]).toBe('08:10');
    expect(startTimes(day.slots)[1]).toBe('08:25');
  });
});
