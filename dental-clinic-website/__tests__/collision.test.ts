import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  cancelBooking,
  createBooking,
  rescheduleBooking,
} from '@/lib/booking/service';
import { isBookingError } from '@/lib/booking/errors';
import { getDayAvailability } from '@/lib/availability/service';
import { loadServiceBySlug, type ServiceForBooking } from '@/lib/availability/loader';
import { prisma } from '@/lib/db';
import {
  addLocalDays,
  dayOfWeekFor,
  todayLocalDate,
} from '@/lib/availability/tz';

/**
 * Double booking prevention.
 *
 * These tests run against the real database through the real transaction, not
 * against a mock, because the behaviour under test is precisely what the
 * transaction does.
 *
 * They operate on dates roughly two months out, which the seed leaves empty, so
 * they neither depend on nor disturb the seeded diary.
 */

let exam: ServiceForBooking;
let longService: ServiceForBooking;
const today = todayLocalDate();

/** A weekday roughly two months out, well clear of the seeded appointments. */
function futureWeekday(offsetFrom = 60): string {
  for (let i = offsetFrom; i < offsetFrom + 10; i += 1) {
    const date = addLocalDays(today, i);
    const dow = dayOfWeekFor(date);
    // Monday to Thursday, when all three dentists keep the widest hours.
    if (dow >= 1 && dow <= 4) return date;
  }
  throw new Error('no suitable future weekday found');
}

const patient = {
  firstName: 'Test',
  lastName: 'Booking',
  email: 'collision.check@example.co.za',
  mobile: '0821119999',
  isExistingPatient: false,
};

const secondPatient = {
  ...patient,
  firstName: 'Second',
  email: 'collision.second@example.co.za',
  mobile: '0821118888',
};

beforeAll(async () => {
  const [e, l] = await Promise.all([
    loadServiceBySlug('routine-examination'),
    loadServiceBySlug('implant-consultation'),
  ]);
  if (!e || !l) throw new Error('Seed data missing. Run npm run db:seed.');
  exam = e;
  longService = l;
});

/** Remove anything these tests created, so repeat runs stay clean. */
afterEach(async () => {
  const emails = [
    'collision.check@example.co.za',
    'collision.second@example.co.za',
  ];
  const patients = await prisma.patient.findMany({
    where: { emailNormalized: { in: emails } },
    select: { id: true },
  });
  const ids = patients.map((p) => p.id);
  if (ids.length === 0) return;

  const appointments = await prisma.appointment.findMany({
    where: { patientId: { in: ids } },
    select: { id: true },
  });
  await prisma.appointmentEvent.deleteMany({
    where: { appointmentId: { in: appointments.map((a) => a.id) } },
  });
  await prisma.appointment.deleteMany({ where: { patientId: { in: ids } } });
  await prisma.patient.deleteMany({ where: { id: { in: ids } } });
});

describe('a booked slot stops being offered', () => {
  it('removes the exact time from availability once taken', async () => {
    const date = futureWeekday();
    const before = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    expect(before.slots.length).toBeGreaterThan(0);

    // Book with a named dentist so the slot cannot simply move to a colleague.
    const target = before.slots[0]!;
    const booking = await createBooking({
      serviceId: exam.id,
      dentistId: target.dentistId,
      date,
      startMinutes: target.startMinutes,
      patient,
    });
    expect(booking.reference).toMatch(/^HDS-[A-Z2-9]{6}$/);

    const after = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: target.dentistId,
    });
    expect(after.slots.some((s) => s.startMinutes === target.startMinutes)).toBe(
      false,
    );
  });

  it('blocks every overlapping start, not just the identical one', async () => {
    const date = futureWeekday(64);

    // A 45 minute appointment with a 15 minute buffer occupies a full hour.
    const available = await getDayAvailability({
      date,
      serviceId: longService.id,
      dentistId: 'any',
    });
    const target = available.slots.find((s) => s.startMinutes === 10 * 60);
    expect(target).toBeDefined();

    await createBooking({
      serviceId: longService.id,
      dentistId: target!.dentistId,
      date,
      startMinutes: target!.startMinutes,
      patient,
    });

    // A 30 minute examination must now be refused at every start that would
    // overlap 10:00 to 11:00, and allowed at the boundaries either side.
    const after = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: target!.dentistId,
    });
    const starts = after.slots.map((s) => s.startMinutes);

    for (const blocked of [9 * 60 + 45, 10 * 60, 10 * 60 + 15, 10 * 60 + 30, 10 * 60 + 45]) {
      expect(starts).not.toContain(blocked);
    }
    // 09:30 ends exactly at 10:00, and 11:00 starts exactly at the end.
    expect(starts).toContain(9 * 60 + 30);
    expect(starts).toContain(11 * 60);
  });
});

describe('two patients competing for the same slot', () => {
  it('confirms exactly one when both requests run concurrently', async () => {
    const date = futureWeekday(68);
    const available = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    const target = available.slots[0]!;

    const attempt = (who: typeof patient) =>
      createBooking({
        serviceId: exam.id,
        // A named dentist, so there is genuinely one chair being contested.
        dentistId: target.dentistId,
        date,
        startMinutes: target.startMinutes,
        patient: who,
      });

    const results = await Promise.allSettled([
      attempt(patient),
      attempt(secondPatient),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // And the database agrees: one appointment, not two.
    const count = await prisma.appointment.count({
      where: {
        dentistId: target.dentistId,
        startTime: new Date(target.startTime),
        status: { in: ['pending', 'confirmed'] },
      },
    });
    expect(count).toBe(1);
  });

  it('tells the loser what happened and offers real alternatives', async () => {
    const date = futureWeekday(72);
    const available = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    const target = available.slots[0]!;

    await createBooking({
      serviceId: exam.id,
      dentistId: target.dentistId,
      date,
      startMinutes: target.startMinutes,
      patient,
    });

    // The second patient submits the slot they were shown a moment ago.
    let caught: unknown;
    try {
      await createBooking({
        serviceId: exam.id,
        dentistId: target.dentistId,
        date,
        startMinutes: target.startMinutes,
        patient: secondPatient,
      });
    } catch (error) {
      caught = error;
    }

    expect(isBookingError(caught)).toBe(true);
    if (!isBookingError(caught)) throw new Error('expected a BookingError');

    expect(['SLOT_TAKEN', 'SLOT_INVALID']).toContain(caught.code);
    expect(caught.status).toBe(409);
    // The alternatives must be genuine, not a placeholder.
    expect(caught.alternatives.length).toBeGreaterThan(0);
    for (const alt of caught.alternatives) {
      expect(alt.startTime).toBeTruthy();
      expect(alt.dentistName).toMatch(/^Dr /);
    }
  });

  it('falls through to an eligible colleague when any dentist was requested', async () => {
    const date = futureWeekday(76);
    const available = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    const target = available.slots[0]!;
    // More than one dentist must be free at this time for the test to mean
    // anything.
    expect(target.alternateDentistIds.length).toBeGreaterThan(0);

    const first = await createBooking({
      serviceId: exam.id,
      dentistId: 'any',
      date,
      startMinutes: target.startMinutes,
      patient,
    });

    // The same time, also as 'any dentist'. The first choice is now taken, so
    // the transaction should assign a colleague rather than refuse.
    const second = await createBooking({
      serviceId: exam.id,
      dentistId: 'any',
      date,
      startMinutes: target.startMinutes,
      patient: secondPatient,
    });

    expect(second.reference).not.toBe(first.reference);
    expect(second.dentistName).not.toBe(first.dentistName);
    expect(second.startLabel).toBe(first.startLabel);
  });
});

describe('cancelling returns the slot', () => {
  it('makes the time bookable again', async () => {
    const date = futureWeekday(80);
    const available = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    const target = available.slots[0]!;

    const booking = await createBooking({
      serviceId: exam.id,
      dentistId: target.dentistId,
      date,
      startMinutes: target.startMinutes,
      patient,
    });

    const taken = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: target.dentistId,
    });
    expect(taken.slots.some((s) => s.startMinutes === target.startMinutes)).toBe(
      false,
    );

    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { reference: booking.reference },
      select: { id: true },
    });
    await cancelBooking({
      appointmentId: appointment.id,
      actor: 'patient',
      reason: 'Test cancellation',
    });

    const freed = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: target.dentistId,
    });
    expect(freed.slots.some((s) => s.startMinutes === target.startMinutes)).toBe(
      true,
    );
  });

  it('is idempotent, so cancelling twice does not error', async () => {
    const date = futureWeekday(84);
    const available = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    const target = available.slots[0]!;

    const booking = await createBooking({
      serviceId: exam.id,
      dentistId: target.dentistId,
      date,
      startMinutes: target.startMinutes,
      patient,
    });
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { reference: booking.reference },
      select: { id: true },
    });

    await cancelBooking({ appointmentId: appointment.id, actor: 'patient' });
    await expect(
      cancelBooking({ appointmentId: appointment.id, actor: 'patient' }),
    ).resolves.toBeUndefined();
  });
});

describe('rescheduling releases the original slot', () => {
  it('frees the old time and claims the new one', async () => {
    const date = futureWeekday(88);
    const available = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    const original = available.slots[0]!;
    const replacement = available.slots.find(
      (s) => s.startMinutes >= original.startMinutes + 120,
    )!;
    expect(replacement).toBeDefined();

    const booking = await createBooking({
      serviceId: exam.id,
      dentistId: original.dentistId,
      date,
      startMinutes: original.startMinutes,
      patient,
    });
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { reference: booking.reference },
      select: { id: true },
    });

    await rescheduleBooking({
      appointmentId: appointment.id,
      date,
      startMinutes: replacement.startMinutes,
      actor: 'patient',
    });

    const after = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: original.dentistId,
    });
    const starts = after.slots.map((s) => s.startMinutes);

    expect(starts).toContain(original.startMinutes);
    expect(starts).not.toContain(replacement.startMinutes);
  });

  it('keeps the same booking reference, because the patient has it written down', async () => {
    const date = futureWeekday(92);
    const available = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    const original = available.slots[0]!;
    const replacement = available.slots[8]!;

    const booking = await createBooking({
      serviceId: exam.id,
      dentistId: original.dentistId,
      date,
      startMinutes: original.startMinutes,
      patient,
    });
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { reference: booking.reference },
      select: { id: true },
    });

    const moved = await rescheduleBooking({
      appointmentId: appointment.id,
      date,
      startMinutes: replacement.startMinutes,
      actor: 'patient',
    });

    expect(moved.reference).toBe(booking.reference);
    expect(moved.startLabel).toBe(replacement.startLabel);
  });

  it('allows a small move inside the appointment own footprint', async () => {
    // The self-exclusion case. Moving 10:00 to 10:15 overlaps the appointment
    // being moved, so without excluding itself this would be impossible, and
    // it is the most common reschedule there is.
    const date = futureWeekday(96);
    const available = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    const original = available.slots.find((s) => s.startMinutes === 10 * 60)!;
    expect(original).toBeDefined();

    const booking = await createBooking({
      serviceId: exam.id,
      dentistId: original.dentistId,
      date,
      startMinutes: original.startMinutes,
      patient,
    });
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { reference: booking.reference },
      select: { id: true },
    });

    const moved = await rescheduleBooking({
      appointmentId: appointment.id,
      date,
      startMinutes: original.startMinutes + 15,
      actor: 'patient',
    });

    expect(moved.startLabel).toBe('10:15');
  });

  it('refuses a move onto a time another patient holds', async () => {
    const date = futureWeekday(100);
    const available = await getDayAvailability({
      date,
      serviceId: exam.id,
      dentistId: 'any',
    });
    const mine = available.slots[0]!;
    const theirs = available.slots.find(
      (s) =>
        s.dentistId === mine.dentistId &&
        s.startMinutes >= mine.startMinutes + 120,
    )!;

    const first = await createBooking({
      serviceId: exam.id,
      dentistId: mine.dentistId,
      date,
      startMinutes: mine.startMinutes,
      patient,
    });
    await createBooking({
      serviceId: exam.id,
      dentistId: theirs.dentistId,
      date,
      startMinutes: theirs.startMinutes,
      patient: secondPatient,
    });

    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { reference: first.reference },
      select: { id: true },
    });

    let caught: unknown;
    try {
      await rescheduleBooking({
        appointmentId: appointment.id,
        date,
        startMinutes: theirs.startMinutes,
        actor: 'patient',
      });
    } catch (error) {
      caught = error;
    }

    expect(isBookingError(caught)).toBe(true);
    if (!isBookingError(caught)) throw new Error('expected a BookingError');
    expect(caught.status).toBe(409);
  });
});

describe('server side validation ignores what the client claims', () => {
  it('refuses a time that is off the slot grid', async () => {
    const date = futureWeekday(104);
    await expect(
      createBooking({
        serviceId: exam.id,
        dentistId: 'any',
        date,
        // 08:07 is not on the fifteen minute grid and was never offered.
        startMinutes: 8 * 60 + 7,
        patient,
      }),
    ).rejects.toThrow();
  });

  it('refuses a time during lunch', async () => {
    const date = futureWeekday(108);
    const dentist = await prisma.dentist.findFirstOrThrow({
      where: { slug: 'dr-anika-naidoo' },
    });
    await expect(
      createBooking({
        serviceId: exam.id,
        dentistId: dentist.id,
        date,
        startMinutes: 13 * 60 + 15,
        patient,
      }),
    ).rejects.toThrow();
  });

  it('refuses a time after the practice has closed', async () => {
    const date = futureWeekday(112);
    await expect(
      createBooking({
        serviceId: exam.id,
        dentistId: 'any',
        date,
        startMinutes: 19 * 60,
        patient,
      }),
    ).rejects.toThrow();
  });

  it('refuses a date in the past', async () => {
    await expect(
      createBooking({
        serviceId: exam.id,
        dentistId: 'any',
        date: addLocalDays(today, -3),
        startMinutes: 9 * 60,
        patient,
      }),
    ).rejects.toThrow();
  });

  it('refuses a dentist who does not offer the service', async () => {
    const date = futureWeekday(116);
    const mkhize = await prisma.dentist.findFirstOrThrow({
      where: { slug: 'dr-sibusiso-mkhize' },
    });
    const whitening = await loadServiceBySlug('whitening-consultation');

    // Dr Mkhize does not take whitening consultations.
    await expect(
      createBooking({
        serviceId: whitening!.id,
        dentistId: mkhize.id,
        date,
        startMinutes: 9 * 60,
        patient,
      }),
    ).rejects.toThrow();
  });
});
