import 'server-only';

import { prisma, type PrismaTransaction } from '@/lib/db';
import type { DayAvailabilityDto, NextAvailableDto, SlotDto } from '@/types';
import { computeSlots } from './compute';
import {
  loadAvailabilityInputs,
  loadClinicSettings,
  loadDentistNames,
  loadService,
} from './loader';
import type { DayUnavailableReason, LocalDate, Slot } from './types';
import {
  addLocalDays,
  formatLocalDateLong,
  formatLocalMinutes,
  formatWeekday,
  todayLocalDate,
  toInstant,
} from './tz';

/**
 * The public availability API.
 *
 * Both the day view and the next-available search run through the same pure
 * core, which is what guarantees the hero widget, the treatment page CTA, the
 * emergency search and the booking calendar can never disagree with each other.
 */

/** How many days are fetched per database round trip during a forward scan. */
const SCAN_CHUNK_DAYS = 7;

/** An absolute ceiling on forward scanning, so a search can never run away. */
const HARD_MAX_SCAN_DAYS = 120;

type Db = typeof prisma | PrismaTransaction;

export interface DayAvailabilityQuery {
  readonly date: LocalDate;
  readonly serviceId: string;
  readonly dentistId: string | 'any';
  /** Include suggestions from following days when the chosen day is empty. */
  readonly includeFallback?: boolean;
  readonly now?: Date;
  readonly db?: Db;
}

export interface NextAvailableQuery {
  readonly fromDate?: LocalDate;
  readonly serviceId: string;
  readonly dentistId: string | 'any';
  readonly count?: number;
  readonly maxDays?: number;
  /** At most one slot per day, so a list of options spans several days. */
  readonly onePerDay?: boolean;
  readonly excludeAppointmentId?: string;
  readonly now?: Date;
  readonly db?: Db;
}

/* ------------------------------------------------------------------ */
/* One day                                                             */
/* ------------------------------------------------------------------ */

export async function getDayAvailability(
  query: DayAvailabilityQuery,
): Promise<DayAvailabilityDto> {
  const db = query.db ?? prisma;
  const now = query.now ?? new Date();

  const [input] = await loadAvailabilityInputs({
    dates: [query.date],
    serviceId: query.serviceId,
    dentistId: query.dentistId,
    now,
    db,
  });

  if (!input) {
    return {
      date: query.date,
      dateLabel: formatLocalDateLong(query.date),
      weekday: formatWeekday(query.date),
      slots: [],
      unavailableMessage: 'This appointment type is not currently available to book online.',
      nextAvailable: [],
    };
  }

  const day = computeSlots(input);
  const names = await loadDentistNames(
    day.slots.map((s) => s.dentistId),
    db,
  );
  const slots = day.slots.map((s) => toSlotDto(s, names));

  // The important behaviour: an empty day never shows a bare "no availability".
  // It explains why, then offers the genuinely next available times.
  let nextAvailable: readonly SlotDto[] = [];
  if (slots.length === 0 && query.includeFallback !== false) {
    const fallback = await findNextAvailable({
      fromDate: addLocalDays(query.date, 1),
      serviceId: query.serviceId,
      dentistId: query.dentistId,
      count: 3,
      onePerDay: true,
      now,
      db,
    });
    nextAvailable = fallback.slots;
  }

  return {
    date: query.date,
    dateLabel: formatLocalDateLong(query.date),
    weekday: formatWeekday(query.date),
    slots,
    unavailableMessage:
      slots.length === 0
        ? unavailableMessage(day.unavailableReason, query.date)
        : null,
    nextAvailable,
  };
}

/**
 * Plain language for an empty day. Written so that a closed Sunday reads
 * differently from a fully booked Wednesday, because they mean different
 * things to the person reading them.
 */
function unavailableMessage(
  reason: DayUnavailableReason | null,
  date: LocalDate,
): string {
  const weekday = formatWeekday(date);
  switch (reason) {
    case 'clinic_closed':
      return `The practice is closed on ${weekday}s.`;
    case 'no_dentist_working':
      return `No dentist who offers this appointment is working on ${weekday}.`;
    case 'no_eligible_dentist':
      return 'This appointment type is not currently available to book online.';
    case 'blocked':
      // Named in full, because "closed on Thursday" could be read as every
      // Thursday rather than this one.
      return `The practice is closed on ${formatLocalDateLong(date)}.`;
    case 'all_slots_in_past':
      return `There are no appointments left on ${weekday}.`;
    case 'fully_booked':
      return `${weekday} is fully booked.`;
    default:
      return `No appointments are available on ${weekday}.`;
  }
}

/* ------------------------------------------------------------------ */
/* Next available                                                      */
/* ------------------------------------------------------------------ */

/**
 * Search forward for the earliest available slots.
 *
 * Used by the hero availability card, the next-appointment call to action on
 * each treatment page, the emergency earliest-first search, and the empty-day
 * fallback above.
 *
 * The scan is strictly bounded: the loop counter increases by a positive
 * constant and is capped, so there is no path on which this runs indefinitely,
 * even against a completely full diary.
 */
export async function findNextAvailable(
  query: NextAvailableQuery,
): Promise<NextAvailableDto> {
  const db = query.db ?? prisma;
  const now = query.now ?? new Date();
  const fromDate = query.fromDate ?? todayLocalDate(now);
  const count = clamp(query.count ?? 1, 1, 20);

  const settings = await loadClinicSettings(db);
  const service = await loadService(query.serviceId, db);

  // Emergency appointments use a short horizon on purpose: a slot three weeks
  // out is not a useful answer for someone in pain.
  const horizon = service?.isEmergency
    ? settings.emergencyHorizonDays
    : settings.bookingHorizonDays;

  const limit = clamp(
    Math.min(query.maxDays ?? 60, horizon),
    1,
    HARD_MAX_SCAN_DAYS,
  );

  const found: SlotDto[] = [];
  let daysScanned = 0;

  for (let offset = 0; offset < limit && found.length < count; offset += SCAN_CHUNK_DAYS) {
    const chunkSize = Math.min(SCAN_CHUNK_DAYS, limit - offset);
    const dates = Array.from({ length: chunkSize }, (_, i) =>
      addLocalDays(fromDate, offset + i),
    );

    const inputs = await loadAvailabilityInputs({
      dates,
      serviceId: query.serviceId,
      dentistId: query.dentistId,
      excludeAppointmentId: query.excludeAppointmentId,
      now,
      db,
    });

    const raw: Slot[] = [];
    for (const input of inputs) {
      daysScanned += 1;
      const day = computeSlots(input);
      if (day.slots.length === 0) continue;
      if (query.onePerDay) {
        raw.push(day.slots[0]!);
      } else {
        raw.push(...day.slots);
      }
      if (raw.length >= count) break;
    }

    if (raw.length > 0) {
      const names = await loadDentistNames(
        raw.map((s) => s.dentistId),
        db,
      );
      for (const slot of raw) {
        found.push(toSlotDto(slot, names));
        if (found.length >= count) break;
      }
    }
  }

  return {
    slots: found,
    daysScanned,
    exhausted: found.length < count,
  };
}

/* ------------------------------------------------------------------ */
/* Which days in a month have availability                             */
/* ------------------------------------------------------------------ */

export interface MonthAvailability {
  /** Dates with at least one bookable slot. */
  readonly availableDates: readonly LocalDate[];
  /** Slot counts per date, so the calendar can distinguish busy from quiet. */
  readonly slotCountByDate: Readonly<Record<string, number>>;
}

/**
 * Availability across a run of days, used to shade the booking calendar.
 *
 * Capped at 62 days, which covers a visible month grid plus its overflow weeks
 * with room to spare.
 */
export async function getRangeAvailability(options: {
  readonly fromDate: LocalDate;
  readonly days: number;
  readonly serviceId: string;
  readonly dentistId: string | 'any';
  readonly excludeAppointmentId?: string;
  readonly now?: Date;
  readonly db?: Db;
}): Promise<MonthAvailability> {
  const db = options.db ?? prisma;
  const now = options.now ?? new Date();
  const days = clamp(options.days, 1, 62);

  const dates = Array.from({ length: days }, (_, i) =>
    addLocalDays(options.fromDate, i),
  );

  const inputs = await loadAvailabilityInputs({
    dates,
    serviceId: options.serviceId,
    dentistId: options.dentistId,
    excludeAppointmentId: options.excludeAppointmentId,
    now,
    db,
  });

  const availableDates: LocalDate[] = [];
  const slotCountByDate: Record<string, number> = {};

  for (const input of inputs) {
    const day = computeSlots(input);
    slotCountByDate[input.date] = day.slots.length;
    if (day.slots.length > 0) availableDates.push(input.date);
  }

  return { availableDates, slotCountByDate };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function toSlotDto(slot: Slot, names: Map<string, string>): SlotDto {
  return {
    date: slot.date,
    startMinutes: slot.startMinutes,
    endMinutes: slot.endMinutes,
    startLabel: formatLocalMinutes(slot.startMinutes),
    endLabel: formatLocalMinutes(slot.endMinutes),
    startTime: toInstant(slot.date, slot.startMinutes).toISOString(),
    dentistId: slot.dentistId,
    dentistName: names.get(slot.dentistId) ?? 'Available dentist',
    alternateDentistIds: slot.alternateDentistIds,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
