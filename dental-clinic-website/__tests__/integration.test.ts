import { beforeAll, describe, expect, it } from 'vitest';
import {
  loadAvailabilityInputs,
  loadServiceBySlug,
  type ServiceForBooking,
} from '@/lib/availability/loader';
import {
  findNextAvailable,
  getDayAvailability,
  getRangeAvailability,
} from '@/lib/availability/service';
import { computeSlots } from '@/lib/availability/compute';
import { overlaps } from '@/lib/availability/overlap';
import { prisma } from '@/lib/db';
import {
  addLocalDays,
  dayOfWeekFor,
  todayLocalDate,
} from '@/lib/availability/tz';

/**
 * Integration tests: the real loader and service against the seeded SQLite
 * database. These check that the Prisma layer feeds the pure core correctly,
 * which unit tests on the core cannot catch.
 *
 * Run `npm run db:reset` followed by `npm run db:seed` if these fail after a
 * schema change.
 */

let exam: ServiceForBooking;
let emergency: ServiceForBooking;
let whitening: ServiceForBooking;
let implant: ServiceForBooking;
const today = todayLocalDate();

beforeAll(async () => {
  const [e, em, w, im] = await Promise.all([
    loadServiceBySlug('routine-examination'),
    loadServiceBySlug('emergency-consultation'),
    loadServiceBySlug('whitening-consultation'),
    loadServiceBySlug('implant-consultation'),
  ]);
  if (!e || !em || !w || !im) {
    throw new Error('Seed data missing. Run npm run db:seed.');
  }
  exam = e;
  emergency = em;
  whitening = w;
  implant = im;
});

/** The next date on or after today falling on the given weekday. */
function nextWeekday(dayOfWeek: number): string {
  for (let i = 0; i < 8; i += 1) {
    const date = addLocalDays(today, i);
    if (dayOfWeekFor(date) === dayOfWeek) return date;
  }
  throw new Error('unreachable');
}

describe('the loader feeds the engine correctly', () => {
  it('reads clinic hours, finding Sunday closed and weekdays open', async () => {
    const sunday = nextWeekday(0);
    const monday = nextWeekday(1);

    const [sundayInput] = await loadAvailabilityInputs({
      dates: [sunday],
      serviceId: exam.id,
      dentistId: 'any',
    });
    const [mondayInput] = await loadAvailabilityInputs({
      dates: [monday],
      serviceId: exam.id,
      dentistId: 'any',
    });

    expect(sundayInput!.clinicHours).toBeNull();
    expect(mondayInput!.clinicHours).toEqual({ start: 480, end: 1020 });
  });

  it('reads the earlier Friday and Saturday closing times', async () => {
    const [friday] = await loadAvailabilityInputs({
      dates: [nextWeekday(5)],
      serviceId: exam.id,
      dentistId: 'any',
    });
    const [saturday] = await loadAvailabilityInputs({
      dates: [nextWeekday(6)],
      serviceId: exam.id,
      dentistId: 'any',
    });

    expect(friday!.clinicHours).toEqual({ start: 480, end: 960 });
    expect(saturday!.clinicHours).toEqual({ start: 480, end: 780 });
  });

  it('loads the lunch break as a separate interval from the working window', async () => {
    const [monday] = await loadAvailabilityInputs({
      dates: [nextWeekday(1)],
      serviceId: exam.id,
      dentistId: 'any',
    });
    const working = monday!.dentists.filter((d) => d.workingWindows.length > 0);
    expect(working.length).toBeGreaterThan(0);
    for (const d of working) {
      expect(d.breaks.length).toBeGreaterThan(0);
    }
  });

  it('restricts whitening to the dentists eligible for it', async () => {
    const [examDay] = await loadAvailabilityInputs({
      dates: [nextWeekday(1)],
      serviceId: exam.id,
      dentistId: 'any',
    });
    const [whiteningDay] = await loadAvailabilityInputs({
      dates: [nextWeekday(1)],
      serviceId: whitening.id,
      dentistId: 'any',
    });

    // All three dentists take examinations; only two offer whitening.
    expect(examDay!.dentists).toHaveLength(3);
    expect(whiteningDay!.dentists).toHaveLength(2);
  });

  it('carries the service duration and buffer through to the engine', async () => {
    const [day] = await loadAvailabilityInputs({
      dates: [nextWeekday(2)],
      serviceId: implant.id,
      dentistId: 'any',
    });
    expect(day!.serviceDurationMinutes).toBe(45);
    expect(day!.bufferAfterMinutes).toBe(15);
  });

  it('applies the configured minimum lead time', async () => {
    const [day] = await loadAvailabilityInputs({
      dates: [today],
      serviceId: exam.id,
      dentistId: 'any',
    });
    expect(day!.minimumLeadTimeMinutes).toBe(120);
  });
});

describe('seeded appointments actually block their slots', () => {
  it('never offers a slot that overlaps a non-cancelled appointment', async () => {
    const date = addLocalDays(today, 2);
    const [input] = await loadAvailabilityInputs({
      dates: [date],
      serviceId: exam.id,
      dentistId: 'any',
    });
    const day = computeSlots(input!);

    // Cross-check every offered slot against every loaded busy interval for
    // that dentist. This is the property that matters most in the whole system.
    for (const slot of day.slots) {
      const dentist = input!.dentists.find((d) => d.dentistId === slot.dentistId)!;
      const reserved = {
        start: slot.startMinutes,
        end: slot.startMinutes + input!.serviceDurationMinutes + input!.bufferAfterMinutes,
      };
      for (const busy of dentist.busy) {
        expect(overlaps(reserved, busy)).toBe(false);
      }
      for (const block of dentist.blocks) {
        expect(overlaps(reserved, block)).toBe(false);
      }
      for (const brk of dentist.breaks) {
        expect(overlaps(reserved, brk)).toBe(false);
      }
    }
  });

  it('ignores cancelled appointments, so a cancelled slot is bookable again', async () => {
    // The seed places a cancelled appointment on top of a confirmed one, which
    // is what happens when a patient cancels and somebody else takes the slot.
    const cancelled = await prisma.appointment.findFirstOrThrow({
      where: { status: 'cancelled' },
      select: { dentistId: true, startTime: true },
    });
    const date = todayLocalDate(cancelled.startTime);
    const dayStart = new Date(`${date}T00:00:00+02:00`);
    const dayEnd = new Date(`${date}T00:00:00+02:00`);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [activeCount, cancelledCount] = await Promise.all([
      prisma.appointment.count({
        where: {
          dentistId: cancelled.dentistId,
          status: { in: ['pending', 'confirmed', 'completed', 'no_show'] },
          startTime: { gte: dayStart, lt: dayEnd },
        },
      }),
      prisma.appointment.count({
        where: {
          dentistId: cancelled.dentistId,
          status: 'cancelled',
          startTime: { gte: dayStart, lt: dayEnd },
        },
      }),
    ]);

    expect(cancelledCount).toBeGreaterThan(0);

    const [input] = await loadAvailabilityInputs({
      dates: [date],
      serviceId: exam.id,
      dentistId: cancelled.dentistId,
    });
    const busy = input!.dentists.flatMap((d) => d.busy);

    // The loader must see exactly the active appointments and none of the
    // cancelled ones, which is the single rule that makes cancellation work.
    expect(busy).toHaveLength(activeCount);
  });
});

describe('next available search', () => {
  it('finds upcoming examination slots and reports how far it looked', async () => {
    const result = await findNextAvailable({
      serviceId: exam.id,
      dentistId: 'any',
      count: 3,
      onePerDay: true,
    });

    expect(result.slots.length).toBe(3);
    expect(result.exhausted).toBe(false);
    expect(result.daysScanned).toBeGreaterThan(0);

    // Chronological, and one per day as requested.
    const dates = result.slots.map((s) => s.date);
    expect([...dates]).toEqual([...dates].sort());
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('returns a named dentist for every slot', async () => {
    const result = await findNextAvailable({
      serviceId: exam.id,
      dentistId: 'any',
      count: 5,
    });
    for (const slot of result.slots) {
      expect(slot.dentistName).toMatch(/^Dr /);
      expect(slot.dentistId).toBeTruthy();
    }
  });

  it('never returns a slot in the past', async () => {
    const result = await findNextAvailable({
      serviceId: exam.id,
      dentistId: 'any',
      count: 5,
    });
    const now = Date.now();
    for (const slot of result.slots) {
      expect(new Date(slot.startTime).getTime()).toBeGreaterThan(now);
    }
  });

  it('honours the short emergency horizon', async () => {
    const result = await findNextAvailable({
      serviceId: emergency.id,
      dentistId: 'any',
      count: 1,
    });
    // The emergency horizon is seeded at seven days.
    expect(result.daysScanned).toBeLessThanOrEqual(7);
  });

  it('respects a specific dentist request', async () => {
    const dentist = await prisma.dentist.findFirstOrThrow({
      where: { slug: 'dr-sibusiso-mkhize' },
    });
    const result = await findNextAvailable({
      serviceId: exam.id,
      dentistId: dentist.id,
      count: 4,
    });
    expect(result.slots.length).toBeGreaterThan(0);
    for (const slot of result.slots) {
      expect(slot.dentistId).toBe(dentist.id);
    }
  });
});

describe('the empty day fallback', () => {
  it('explains that Sunday is closed and offers real alternatives instead', async () => {
    const sunday = nextWeekday(0);
    const day = await getDayAvailability({
      date: sunday,
      serviceId: exam.id,
      dentistId: 'any',
    });

    expect(day.slots).toHaveLength(0);
    expect(day.unavailableMessage).toBe('The practice is closed on Sundays.');
    // The important part: not a bare "no availability".
    expect(day.nextAvailable.length).toBeGreaterThan(0);
    for (const slot of day.nextAvailable) {
      expect(slot.date > sunday).toBe(true);
    }
  });

  it('says a dentist is not working rather than that the day is booked', async () => {
    // Dr Govender works Monday, Wednesday and Friday only.
    const govender = await prisma.dentist.findFirstOrThrow({
      where: { slug: 'dr-leila-govender' },
    });
    const tuesday = nextWeekday(2);

    const day = await getDayAvailability({
      date: tuesday,
      serviceId: exam.id,
      dentistId: govender.id,
    });

    expect(day.slots).toHaveLength(0);
    expect(day.unavailableMessage).toContain('is working on Tuesday');
    expect(day.nextAvailable.length).toBeGreaterThan(0);
  });

  it('labels the day in full for display', async () => {
    const day = await getDayAvailability({
      date: nextWeekday(1),
      serviceId: exam.id,
      dentistId: 'any',
    });
    expect(day.weekday).toBe('Monday');
    expect(day.dateLabel).toMatch(/^Monday, \d{1,2} \w+ \d{4}$/);
  });
});

describe('range availability for the calendar', () => {
  it('reports a slot count for every requested day', async () => {
    const range = await getRangeAvailability({
      fromDate: today,
      days: 14,
      serviceId: exam.id,
      dentistId: 'any',
    });

    expect(Object.keys(range.slotCountByDate)).toHaveLength(14);
    for (const date of range.availableDates) {
      expect(range.slotCountByDate[date]!).toBeGreaterThan(0);
    }
  });

  it('marks every Sunday in the range as unavailable', async () => {
    const range = await getRangeAvailability({
      fromDate: today,
      days: 21,
      serviceId: exam.id,
      dentistId: 'any',
    });

    for (const [date, count] of Object.entries(range.slotCountByDate)) {
      if (dayOfWeekFor(date) === 0) expect(count).toBe(0);
    }
  });

  it('finds some availability over a three week window', async () => {
    const range = await getRangeAvailability({
      fromDate: today,
      days: 21,
      serviceId: exam.id,
      dentistId: 'any',
    });
    expect(range.availableDates.length).toBeGreaterThan(5);
  });
});
