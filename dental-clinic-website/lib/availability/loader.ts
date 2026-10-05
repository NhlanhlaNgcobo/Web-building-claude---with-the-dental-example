import 'server-only';

import { prisma, type PrismaTransaction } from '@/lib/db';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/domain/enums';
import type {
  AvailabilityInput,
  DentistDayInput,
  Interval,
  LocalDate,
} from './types';
import {
  SLOT_GRANULARITY_MINUTES,
  clipInstantsToLocalDay,
  dayOfWeekFor,
  dayPositionFor,
  endOfLocalDay,
  nowLocalMinutesFor,
  startOfLocalDay,
} from './tz';

/**
 * The boundary between the database and the pure availability engine.
 *
 * This module is the only thing in the availability path that knows about
 * Prisma or about timezones. Its single job is to turn stored rows into the
 * plain-integer AvailabilityInput that lib/availability/compute.ts consumes.
 */

type Db = typeof prisma | PrismaTransaction;

export interface LoadAvailabilityOptions {
  /** Local dates to load, which may span weeks for a next-available search. */
  readonly dates: readonly LocalDate[];
  readonly serviceId: string;
  /** A dentist id, or 'any' to consider every dentist eligible for the service. */
  readonly dentistId: string | 'any';
  /**
   * Excluded from the busy list. Used when rescheduling, because an appointment
   * must not be treated as blocking the slot it is being moved within.
   */
  readonly excludeAppointmentId?: string;
  /** Injectable for tests. */
  readonly now?: Date;
  /** Set when loading inside an interactive transaction. */
  readonly db?: Db;
}

export interface ServiceForBooking {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly durationMinutes: number;
  readonly bufferAfterMinutes: number;
  readonly priceFromCents: number | null;
  readonly depositType: string;
  readonly depositAmountCents: number | null;
  readonly isEmergency: boolean;
  readonly isBookableOnline: boolean;
}

/* ------------------------------------------------------------------ */
/* Clinic settings                                                     */
/* ------------------------------------------------------------------ */

export interface ClinicSettings {
  /** Patients cannot book closer than this to the current time. */
  readonly minimumLeadTimeMinutes: number;
  /** How far ahead online booking is open. */
  readonly bookingHorizonDays: number;
  /** Emergency searches look only this far, since a distant slot is no help. */
  readonly emergencyHorizonDays: number;
}

/** Used when a setting row is missing or holds something unparseable. */
const SETTING_DEFAULTS: ClinicSettings = {
  minimumLeadTimeMinutes: 120,
  bookingHorizonDays: 120,
  emergencyHorizonDays: 7,
};

/**
 * Settings are read fresh on each request rather than cached, because they are
 * three rows and because a stale lead time would let a patient book a slot the
 * practice has already decided is too close.
 */
export async function loadClinicSettings(db: Db = prisma): Promise<ClinicSettings> {
  const rows = await db.clinicSetting.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const readNumber = (key: keyof ClinicSettings): number => {
    const raw = byKey.get(key);
    const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : SETTING_DEFAULTS[key];
  };
  return {
    minimumLeadTimeMinutes: readNumber('minimumLeadTimeMinutes'),
    bookingHorizonDays: readNumber('bookingHorizonDays'),
    emergencyHorizonDays: readNumber('emergencyHorizonDays'),
  };
}

/* ------------------------------------------------------------------ */
/* Service lookup                                                      */
/* ------------------------------------------------------------------ */

export async function loadService(
  serviceId: string,
  db: Db = prisma,
): Promise<ServiceForBooking | null> {
  const service = await db.service.findFirst({
    where: { id: serviceId, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      durationMinutes: true,
      bufferAfterMinutes: true,
      priceFromCents: true,
      depositType: true,
      depositAmountCents: true,
      isEmergency: true,
      isBookableOnline: true,
    },
  });
  return service;
}

export async function loadServiceBySlug(
  slug: string,
  db: Db = prisma,
): Promise<ServiceForBooking | null> {
  const service = await db.service.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      durationMinutes: true,
      bufferAfterMinutes: true,
      priceFromCents: true,
      depositType: true,
      depositAmountCents: true,
      isEmergency: true,
      isBookableOnline: true,
    },
  });
  return service;
}

/* ------------------------------------------------------------------ */
/* The main loader                                                     */
/* ------------------------------------------------------------------ */

/**
 * Build one AvailabilityInput per requested date.
 *
 * Everything is fetched in a small, fixed number of queries covering the whole
 * date range rather than one query per day, so that a sixty day
 * next-available search does not become one hundred and twenty round trips.
 */
export async function loadAvailabilityInputs(
  options: LoadAvailabilityOptions,
): Promise<AvailabilityInput[]> {
  const db = options.db ?? prisma;
  const { dates, serviceId } = options;
  if (dates.length === 0) return [];

  const now = options.now ?? new Date();

  const service = await loadService(serviceId, db);
  if (!service) return [];

  const settings = await loadClinicSettings(db);

  // Dentists eligible for this service, narrowed further when a specific
  // dentist was requested. An ineligible dentist never reaches the engine.
  const eligibility = await db.serviceDentist.findMany({
    where: {
      serviceId,
      ...(options.dentistId !== 'any' ? { dentistId: options.dentistId } : {}),
      dentist: { isActive: true },
    },
    select: {
      dentistId: true,
      durationMinutesOverride: true,
      dentist: { select: { id: true, sortOrder: true } },
    },
  });

  const dentistIds = eligibility.map((e) => e.dentistId);
  if (dentistIds.length === 0) {
    // Still return a well-formed input per day so the engine can report
    // 'no_eligible_dentist' rather than the caller guessing at an empty array.
    return dates.map((date) => ({
      date,
      dayOfWeek: dayOfWeekFor(date),
      clinicHours: null,
      dentists: [],
      serviceDurationMinutes: service.durationMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      granularityMinutes: SLOT_GRANULARITY_MINUTES,
      dayPosition: dayPositionFor(date, now),
      nowLocalMinutes: nowLocalMinutesFor(date, now),
      minimumLeadTimeMinutes: settings.minimumLeadTimeMinutes,
    }));
  }

  const overrideByDentist = new Map(
    eligibility.map((e) => [e.dentistId, e.durationMinutesOverride]),
  );
  const sortOrderByDentist = new Map(
    eligibility.map((e) => [e.dentistId, e.dentist.sortOrder]),
  );

  const [clinicHoursRows, scheduleRows] = await Promise.all([
    db.clinicHours.findMany(),
    db.dentistSchedule.findMany({
      where: { dentistId: { in: dentistIds }, isActive: true },
    }),
  ]);

  const clinicHoursByDay = new Map(clinicHoursRows.map((r) => [r.dayOfWeek, r]));

  // One window covering every requested date, so appointments and blocks are
  // each a single query regardless of how many days are being examined.
  const sortedDates = [...dates].sort();
  const windowStart = startOfLocalDay(sortedDates[0]!);
  const windowEnd = endOfLocalDay(sortedDates[sortedDates.length - 1]!);

  const [appointments, blocks] = await Promise.all([
    db.appointment.findMany({
      where: {
        dentistId: { in: dentistIds },
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        // Half-open overlap against the whole window.
        startTime: { lt: windowEnd },
        endTime: { gt: windowStart },
        ...(options.excludeAppointmentId
          ? { id: { not: options.excludeAppointmentId } }
          : {}),
      },
      select: { dentistId: true, startTime: true, endTime: true },
    }),
    db.blockedTime.findMany({
      where: {
        // A null dentistId is a clinic-wide block and applies to everyone.
        OR: [{ dentistId: { in: dentistIds } }, { dentistId: null }],
        startTime: { lt: windowEnd },
        // Load bearing: a fortnight of leave that began before the window has
        // a startTime earlier than windowStart, so testing endTime is the only
        // way to catch it.
        endTime: { gt: windowStart },
      },
      select: { dentistId: true, startTime: true, endTime: true },
    }),
  ]);

  return dates.map((date) => {
    const dayOfWeek = dayOfWeekFor(date);
    const clinicRow = clinicHoursByDay.get(dayOfWeek);
    const clinicHours: Interval | null =
      !clinicRow || clinicRow.isClosed
        ? null
        : { start: clinicRow.openMinutes, end: clinicRow.closeMinutes };

    const dentists: DentistDayInput[] = dentistIds.map((dentistId) => {
      const daySchedules = scheduleRows.filter(
        (s) => s.dentistId === dentistId && s.dayOfWeek === dayOfWeek,
      );

      const workingWindows: Interval[] = [];
      const breaks: Interval[] = [];
      for (const s of daySchedules) {
        if (s.endMinutes > s.startMinutes) {
          workingWindows.push({ start: s.startMinutes, end: s.endMinutes });
        }
        if (
          s.breakStartMinutes !== null &&
          s.breakEndMinutes !== null &&
          s.breakEndMinutes > s.breakStartMinutes
        ) {
          breaks.push({ start: s.breakStartMinutes, end: s.breakEndMinutes });
        }
      }

      const busy: Interval[] = [];
      for (const a of appointments) {
        if (a.dentistId !== dentistId) continue;
        const clipped = clipInstantsToLocalDay(a.startTime, a.endTime, date);
        if (clipped) busy.push(clipped);
      }

      const dentistBlocks: Interval[] = [];
      for (const b of blocks) {
        if (b.dentistId !== null && b.dentistId !== dentistId) continue;
        const clipped = clipInstantsToLocalDay(b.startTime, b.endTime, date);
        if (clipped) dentistBlocks.push(clipped);
      }

      const override = overrideByDentist.get(dentistId);
      return {
        dentistId,
        sortOrder: sortOrderByDentist.get(dentistId) ?? 100,
        workingWindows,
        breaks,
        busy,
        blocks: dentistBlocks,
        ...(override !== null && override !== undefined
          ? { durationMinutesOverride: override }
          : {}),
      };
    });

    return {
      date,
      dayOfWeek,
      clinicHours,
      dentists,
      serviceDurationMinutes: service.durationMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      granularityMinutes: SLOT_GRANULARITY_MINUTES,
      dayPosition: dayPositionFor(date, now),
      nowLocalMinutes: nowLocalMinutesFor(date, now),
      minimumLeadTimeMinutes: settings.minimumLeadTimeMinutes,
    };
  });
}

/** Display names for a set of dentist ids, used when building slot payloads. */
export async function loadDentistNames(
  dentistIds: readonly string[],
  db: Db = prisma,
): Promise<Map<string, string>> {
  if (dentistIds.length === 0) return new Map();
  const rows = await db.dentist.findMany({
    where: { id: { in: [...dentistIds] } },
    select: { id: true, title: true, lastName: true },
  });
  return new Map(rows.map((r) => [r.id, `${r.title} ${r.lastName}`]));
}
