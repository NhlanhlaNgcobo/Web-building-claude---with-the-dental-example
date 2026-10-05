/**
 * Database seed.
 *
 * Creates the practice as it would actually look in use: a full clinic week,
 * three dentists on different patterns, the appointment types and shop, and a
 * diary that is genuinely partly booked, with leave and a training afternoon
 * blocked out.
 *
 * The appointments are generated relative to the date the seed runs, so the
 * booking pages always have realistic availability to compute against rather
 * than a diary that has aged into the past.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import { requireDatabaseUrl } from '../lib/env';
import { dentistSeeds } from '../data/dentists';
import { serviceSeeds } from '../data/services';
import { productSeeds } from '../data/products';
import { generateAppointmentReference } from '../lib/booking/reference';
import {
  addLocalDays,
  dayOfWeekFor,
  todayLocalDate,
  toInstant,
} from '../lib/availability/tz';

const adapter = new PrismaPg({ connectionString: requireDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

/** 'HH:MM' to minutes from local midnight. */
function m(hhmm: string): number {
  const [h, min] = hhmm.split(':').map(Number);
  return h! * 60 + min!;
}

/**
 * Clinic opening hours. These are the authoritative hours used by the
 * availability engine. data/clinic.ts holds the display copy and must match.
 */
const CLINIC_HOURS = [
  { dayOfWeek: 0, isClosed: true, open: '00:00', close: '00:00' },
  { dayOfWeek: 1, isClosed: false, open: '08:00', close: '17:00' },
  { dayOfWeek: 2, isClosed: false, open: '08:00', close: '17:00' },
  { dayOfWeek: 3, isClosed: false, open: '08:00', close: '17:00' },
  { dayOfWeek: 4, isClosed: false, open: '08:00', close: '17:00' },
  { dayOfWeek: 5, isClosed: false, open: '08:00', close: '16:00' },
  { dayOfWeek: 6, isClosed: false, open: '08:00', close: '13:00' },
];

/**
 * A small deterministic generator, so that reseeding produces the same diary.
 * An unpredictable seed would make a test failure impossible to reproduce.
 */
function makeRandom(seed: number) {
  let state = seed;
  return function next(): number {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

async function clearAll() {
  // Ordered so that foreign keys are never violated.
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.appointmentEvent.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.blockedTime.deleteMany();
  await prisma.dentistSchedule.deleteMany();
  await prisma.serviceProduct.deleteMany();
  await prisma.serviceDentist.deleteMany();
  await prisma.service.deleteMany();
  await prisma.product.deleteMany();
  await prisma.dentist.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.clinicHours.deleteMany();
  await prisma.clinicSetting.deleteMany();
}

async function main() {
  console.log('Seeding Harbour Dental Studio...');
  await clearAll();

  /* ---------------------------------------------------------------- */
  /* Clinic settings and hours                                        */
  /* ---------------------------------------------------------------- */

  await prisma.clinicSetting.createMany({
    data: [
      // Patients cannot book less than two hours ahead, so reception has time
      // to prepare and the diary does not change under a clinician's feet.
      { key: 'minimumLeadTimeMinutes', value: '120' },
      // How far ahead online booking is open.
      { key: 'bookingHorizonDays', value: '120' },
      // Emergency searches look only a week ahead; a slot three weeks out is
      // not an answer to someone in pain.
      { key: 'emergencyHorizonDays', value: '7' },
    ],
  });

  for (const h of CLINIC_HOURS) {
    await prisma.clinicHours.create({
      data: {
        dayOfWeek: h.dayOfWeek,
        isClosed: h.isClosed,
        openMinutes: m(h.open),
        closeMinutes: m(h.close),
      },
    });
  }
  console.log(`  clinic hours: ${CLINIC_HOURS.length} days`);

  /* ---------------------------------------------------------------- */
  /* Products                                                         */
  /* ---------------------------------------------------------------- */

  const productIdBySlug = new Map<string, string>();
  for (const p of productSeeds) {
    const created = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        category: p.category,
        shortDescription: p.shortDescription,
        description: p.description,
        includes: p.includes?.join('\n') ?? null,
        usageNotes: p.usageNotes ?? null,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        sortOrder: p.sortOrder,
      },
    });
    productIdBySlug.set(p.slug, created.id);
  }
  console.log(`  products: ${productSeeds.length}`);

  /* ---------------------------------------------------------------- */
  /* Services                                                         */
  /* ---------------------------------------------------------------- */

  const serviceIdBySlug = new Map<string, string>();
  for (const s of serviceSeeds) {
    const created = await prisma.service.create({
      data: {
        slug: s.slug,
        name: s.name,
        category: s.category,
        shortDescription: s.shortDescription,
        durationMinutes: s.durationMinutes,
        bufferAfterMinutes: s.bufferAfterMinutes,
        priceFromCents: s.priceFromCents,
        depositType: s.depositType,
        depositAmountCents: s.depositAmountCents,
        isEmergency: s.isEmergency,
        allowsUpsell: s.allowsUpsell,
        sortOrder: s.sortOrder,
      },
    });
    serviceIdBySlug.set(s.slug, created.id);

    // Related products, which is what drives contextual recommendations.
    for (const [index, productSlug] of s.relatedProductSlugs.entries()) {
      const productId = productIdBySlug.get(productSlug);
      if (!productId) throw new Error(`Unknown product slug: ${productSlug}`);
      await prisma.serviceProduct.create({
        data: { serviceId: created.id, productId, sortOrder: index * 10 },
      });
    }
  }
  console.log(`  services: ${serviceSeeds.length}`);

  /* ---------------------------------------------------------------- */
  /* Dentists, eligibility and weekly schedules                       */
  /* ---------------------------------------------------------------- */

  const dentistIdBySlug = new Map<string, string>();
  for (const d of dentistSeeds) {
    const created = await prisma.dentist.create({
      data: {
        slug: d.slug,
        title: d.title,
        firstName: d.firstName,
        lastName: d.lastName,
        role: d.role,
        bio: d.bio,
        focusAreas: d.focusAreas.join('\n'),
        photoUrl: d.photoUrl,
        sortOrder: d.sortOrder,
      },
    });
    dentistIdBySlug.set(d.slug, created.id);

    for (const serviceSlug of d.serviceSlugs) {
      const serviceId = serviceIdBySlug.get(serviceSlug);
      if (!serviceId) throw new Error(`Unknown service slug: ${serviceSlug}`);
      await prisma.serviceDentist.create({
        data: { serviceId, dentistId: created.id },
      });
    }

    for (const slot of d.schedule) {
      await prisma.dentistSchedule.create({
        data: {
          dentistId: created.id,
          dayOfWeek: slot.dayOfWeek,
          startMinutes: m(slot.start),
          endMinutes: m(slot.end),
          breakStartMinutes: slot.breakStart ? m(slot.breakStart) : null,
          breakEndMinutes: slot.breakEnd ? m(slot.breakEnd) : null,
        },
      });
    }
  }
  console.log(`  dentists: ${dentistSeeds.length}, with weekly schedules`);

  /* ---------------------------------------------------------------- */
  /* Patients                                                         */
  /* ---------------------------------------------------------------- */

  const patientSeeds = [
    ['Thandeka', 'Zulu', 'thandeka.zulu@example.co.za', '+27821110001'],
    ['Rajesh', 'Pillay', 'rajesh.pillay@example.co.za', '+27821110002'],
    ['Megan', 'Fourie', 'megan.fourie@example.co.za', '+27821110003'],
    ['Sipho', 'Ndlovu', 'sipho.ndlovu@example.co.za', '+27821110004'],
    ['Aisha', 'Patel', 'aisha.patel@example.co.za', '+27821110005'],
    ['Daniel', 'van Wyk', 'daniel.vanwyk@example.co.za', '+27821110006'],
    ['Nomusa', 'Dlamini', 'nomusa.dlamini@example.co.za', '+27821110007'],
    ['Craig', 'Bennett', 'craig.bennett@example.co.za', '+27821110008'],
    ['Priya', 'Ramsamy', 'priya.ramsamy@example.co.za', '+27821110009'],
    ['Lerato', 'Mabaso', 'lerato.mabaso@example.co.za', '+27821110010'],
    ['Johan', 'Steyn', 'johan.steyn@example.co.za', '+27821110011'],
    ['Zanele', 'Khumalo', 'zanele.khumalo@example.co.za', '+27821110012'],
  ] as const;

  const patientIds: string[] = [];
  for (const [firstName, lastName, email, mobile] of patientSeeds) {
    const created = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email,
        emailNormalized: email.toLowerCase(),
        mobile,
        mobileNormalized: mobile,
        isExistingPatient: true,
      },
    });
    patientIds.push(created.id);
  }
  console.log(`  patients: ${patientSeeds.length}`);

  /* ---------------------------------------------------------------- */
  /* Blocked periods                                                  */
  /* ---------------------------------------------------------------- */

  const today = todayLocalDate();

  // Dr Govender takes a week of leave starting a fortnight out. Deliberately
  // spans several days so that the loader's multi-day clipping is exercised.
  const leaveStart = nextWeekdayOnOrAfter(addLocalDays(today, 14), 1);
  await prisma.blockedTime.create({
    data: {
      dentistId: dentistIdBySlug.get('dr-leila-govender')!,
      startTime: toInstant(leaveStart, 0),
      endTime: toInstant(addLocalDays(leaveStart, 5), 0),
      reason: 'leave',
      note: 'Annual leave',
    },
  });

  // Dr Naidoo is at training on a Wednesday afternoon next week.
  const trainingDay = nextWeekdayOnOrAfter(addLocalDays(today, 7), 3);
  await prisma.blockedTime.create({
    data: {
      dentistId: dentistIdBySlug.get('dr-anika-naidoo')!,
      startTime: toInstant(trainingDay, m('13:00')),
      endTime: toInstant(trainingDay, m('17:00')),
      reason: 'training',
      note: 'Clinical training afternoon',
    },
  });

  // A clinic-wide equipment service morning, which blocks every dentist.
  const maintenanceDay = nextWeekdayOnOrAfter(addLocalDays(today, 21), 2);
  await prisma.blockedTime.create({
    data: {
      dentistId: null,
      startTime: toInstant(maintenanceDay, m('08:00')),
      endTime: toInstant(maintenanceDay, m('11:00')),
      reason: 'maintenance',
      note: 'Equipment service and calibration',
    },
  });
  console.log('  blocked periods: leave, training, clinic-wide maintenance');

  /* ---------------------------------------------------------------- */
  /* Existing appointments                                            */
  /* ---------------------------------------------------------------- */

  const random = makeRandom(20_261_005);
  const bookableServices = serviceSeeds.filter((s) => s.slug !== 'emergency-consultation');

  // Pre-load the roster and blocks so the generator never creates an
  // appointment that the availability engine would consider impossible.
  const schedules = await prisma.dentistSchedule.findMany();
  const blocks = await prisma.blockedTime.findMany();

  type Placed = { dentistId: string; start: number; end: number; date: string };
  const placed: Placed[] = [];
  let appointmentCount = 0;
  let patientCursor = 0;

  // Fill roughly the next three weeks at a believable density. Today itself is
  // left comparatively open so there is same-day availability to demonstrate.
  for (let dayOffset = 0; dayOffset <= 21; dayOffset += 1) {
    const date = addLocalDays(today, dayOffset);
    const dow = dayOfWeekFor(date);
    const hours = CLINIC_HOURS.find((h) => h.dayOfWeek === dow)!;
    if (hours.isClosed) continue;

    const targetPerDay = dayOffset === 0 ? 3 : dayOffset <= 2 ? 9 : 7;

    for (const d of dentistSeeds) {
      const dentistId = dentistIdBySlug.get(d.slug)!;
      const daySchedules = schedules.filter(
        (s) => s.dentistId === dentistId && s.dayOfWeek === dow,
      );
      if (daySchedules.length === 0) continue;

      let madeForDentist = 0;
      const perDentist = Math.ceil(targetPerDay / dentistSeeds.length);

      // Try a bounded number of random placements rather than looping until
      // success, so a fully blocked day can never hang the seed.
      for (let attempt = 0; attempt < 40 && madeForDentist < perDentist; attempt += 1) {
        const schedule = daySchedules[0]!;
        const service =
          bookableServices[Math.floor(random() * bookableServices.length)]!;
        if (!d.serviceSlugs.includes(service.slug)) continue;

        const reserved = service.durationMinutes + service.bufferAfterMinutes;
        const windowStart = Math.max(schedule.startMinutes, m(hours.open));
        const windowEnd = Math.min(schedule.endMinutes, m(hours.close));
        const steps = Math.floor((windowEnd - windowStart - reserved) / 15);
        if (steps <= 0) continue;

        const start = windowStart + Math.floor(random() * steps) * 15;
        const end = start + reserved;
        if (end > windowEnd) continue;

        // Never place an appointment over a break, an existing appointment or a
        // block. Uses the same half-open overlap rule as the engine.
        const breakClash =
          schedule.breakStartMinutes !== null &&
          schedule.breakEndMinutes !== null &&
          start < schedule.breakEndMinutes &&
          schedule.breakStartMinutes < end;
        if (breakClash) continue;

        const appointmentClash = placed.some(
          (p) =>
            p.dentistId === dentistId &&
            p.date === date &&
            start < p.end &&
            p.start < end,
        );
        if (appointmentClash) continue;

        const startInstant = toInstant(date, start);
        const endInstant = toInstant(date, end);
        const blockClash = blocks.some(
          (b) =>
            (b.dentistId === null || b.dentistId === dentistId) &&
            startInstant < b.endTime &&
            b.startTime < endInstant,
        );
        if (blockClash) continue;

        // Today's remaining slots are left free so the site has same-day times.
        if (dayOffset === 0 && start < 14 * 60) continue;

        const patientId = patientIds[patientCursor % patientIds.length]!;
        patientCursor += 1;

        const created = await prisma.appointment.create({
          data: {
            reference: generateAppointmentReference(),
            patientId,
            dentistId,
            serviceId: serviceIdBySlug.get(service.slug)!,
            startTime: startInstant,
            serviceEndTime: toInstant(date, start + service.durationMinutes),
            endTime: endInstant,
            status: dayOffset === 0 && random() > 0.7 ? 'completed' : 'confirmed',
            depositType: service.depositType,
            depositAmountCents: service.depositAmountCents,
            depositStatus:
              service.depositType === 'none' ? 'not_required' : 'paid',
            source: random() > 0.75 ? 'phone' : 'web',
          },
        });
        await prisma.appointmentEvent.create({
          data: {
            appointmentId: created.id,
            type: 'created',
            actor: 'system',
            payloadJson: JSON.stringify({ seeded: true }),
          },
        });

        placed.push({ dentistId, start, end, date });
        madeForDentist += 1;
        appointmentCount += 1;
      }
    }
  }
  console.log(`  appointments: ${appointmentCount} across the next three weeks`);

  /* ---------------------------------------------------------------- */
  /* A couple of historic appointments, so the diary has a past        */
  /* ---------------------------------------------------------------- */

  const pastDate = previousWeekdayOnOrBefore(addLocalDays(today, -7), 2);
  const examService = serviceIdBySlug.get('routine-examination')!;
  for (const [index, patientId] of patientIds.slice(0, 3).entries()) {
    const start = m('09:00') + index * 45;
    await prisma.appointment.create({
      data: {
        reference: generateAppointmentReference(),
        patientId,
        dentistId: dentistIdBySlug.get('dr-anika-naidoo')!,
        serviceId: examService,
        startTime: toInstant(pastDate, start),
        serviceEndTime: toInstant(pastDate, start + 30),
        endTime: toInstant(pastDate, start + 30),
        status: index === 2 ? 'no_show' : 'completed',
        depositStatus: 'not_required',
        source: 'web',
      },
    });
  }

  // A cancelled appointment placed deliberately on top of an existing confirmed
  // one, which models exactly what happens in practice: a patient cancels and
  // somebody else takes the slot.
  //
  // It is here so that the most important rule in the system is visible in the
  // seeded data and not only in the test suite: cancelling is the one thing
  // that returns a slot to availability, so a cancelled row must never be
  // counted as busy. If the engine ever regressed and treated cancelled
  // appointments as blocking, this row would make the diary wrong immediately.
  const reBooked = placed.find((p) => p.date > today);
  if (reBooked) {
    await prisma.appointment.create({
      data: {
        reference: generateAppointmentReference(),
        patientId: patientIds[0]!,
        dentistId: reBooked.dentistId,
        serviceId: examService,
        startTime: toInstant(reBooked.date, reBooked.start),
        serviceEndTime: toInstant(reBooked.date, reBooked.start + 30),
        endTime: toInstant(reBooked.date, reBooked.start + 30),
        status: 'cancelled',
        depositStatus: 'not_required',
        cancelledAt: new Date(),
        cancelledBy: 'patient',
        cancelReason: 'Schedule conflict',
        source: 'web',
      },
    });
  }
  console.log('  historic appointments and one cancellation added');

  console.log('Seed complete.');
}

/** The next date on or after `from` that falls on `dayOfWeek`. */
function nextWeekdayOnOrAfter(from: string, dayOfWeek: number): string {
  let date = from;
  for (let i = 0; i < 7; i += 1) {
    if (dayOfWeekFor(date) === dayOfWeek) return date;
    date = addLocalDays(date, 1);
  }
  return from;
}

/** The latest date on or before `from` that falls on `dayOfWeek`. */
function previousWeekdayOnOrBefore(from: string, dayOfWeek: number): string {
  let date = from;
  for (let i = 0; i < 7; i += 1) {
    if (dayOfWeekFor(date) === dayOfWeek) return date;
    date = addLocalDays(date, -1);
  }
  return from;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
