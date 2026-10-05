import { addDays, format, parse } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import type { DayOfWeek, Interval, LocalDate, LocalMinutes } from './types';

/**
 * The clinic timezone. South Africa does not observe daylight saving, so the
 * offset is a constant UTC+2, but the conversion is still done properly through
 * date-fns-tz rather than by adding two hours, so that nothing breaks if this
 * ever runs for a practice in a zone that does shift.
 */
export const CLINIC_TIME_ZONE = 'Africa/Johannesburg';

/** Minutes in a day, used as the exclusive upper bound for LocalMinutes. */
export const MINUTES_PER_DAY = 1440;

/** The granularity of the candidate start grid, in minutes. */
export const SLOT_GRANULARITY_MINUTES = 15;

/* ------------------------------------------------------------------ */
/* Local date helpers                                                  */
/* ------------------------------------------------------------------ */

/** The current local calendar date at the clinic, as 'YYYY-MM-DD'. */
export function todayLocalDate(now: Date = new Date()): LocalDate {
  return format(toZonedTime(now, CLINIC_TIME_ZONE), 'yyyy-MM-dd');
}

/**
 * The clinic's current wall clock time as minutes from local midnight, but only
 * when `date` is genuinely today at the clinic. Returns null for any other day,
 * which is the signal the engine uses to skip the past-time and lead-time
 * filters entirely.
 */
export function nowLocalMinutesFor(
  date: LocalDate,
  now: Date = new Date(),
): LocalMinutes | null {
  if (date !== todayLocalDate(now)) return null;
  const zoned = toZonedTime(now, CLINIC_TIME_ZONE);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

/**
 * Where a local date sits relative to the clinic's current day.
 *
 * Kept explicit so that a past date is never mistaken for a future one, which
 * would let the engine skip its past-time filtering entirely.
 */
export function dayPositionFor(
  date: LocalDate,
  now: Date = new Date(),
): 'past' | 'today' | 'future' {
  const today = todayLocalDate(now);
  if (date === today) return 'today';
  // ISO dates compare correctly as strings.
  return date < today ? 'past' : 'future';
}

/** The weekday of a local date, 0 for Sunday through 6 for Saturday. */
export function dayOfWeekFor(date: LocalDate): DayOfWeek {
  // Parsed as a plain calendar date, so no timezone shift can move the weekday.
  return parse(date, 'yyyy-MM-dd', new Date()).getDay() as DayOfWeek;
}

/** Add whole days to a local date, staying in the local calendar. */
export function addLocalDays(date: LocalDate, days: number): LocalDate {
  return format(addDays(parse(date, 'yyyy-MM-dd', new Date()), days), 'yyyy-MM-dd');
}

/** A run of consecutive local dates starting at `from`. */
export function localDateRange(from: LocalDate, count: number): LocalDate[] {
  return Array.from({ length: count }, (_, i) => addLocalDays(from, i));
}

/** Whether `a` is strictly before `b`. Lexicographic works for ISO dates. */
export function isLocalDateBefore(a: LocalDate, b: LocalDate): boolean {
  return a < b;
}

/* ------------------------------------------------------------------ */
/* Conversion between local wall clock and UTC instants                */
/* ------------------------------------------------------------------ */

/**
 * A local date plus minutes from local midnight, converted to a UTC instant.
 * This is the single place where a wall clock time becomes a point in time.
 */
export function toInstant(date: LocalDate, minutes: LocalMinutes): Date {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const wallClock = `${date}T${pad(hours)}:${pad(mins)}:00`;
  return fromZonedTime(wallClock, CLINIC_TIME_ZONE);
}

/** The UTC instant at local midnight on `date`. */
export function startOfLocalDay(date: LocalDate): Date {
  return toInstant(date, 0);
}

/** The UTC instant at local midnight on the following day, exclusive. */
export function endOfLocalDay(date: LocalDate): Date {
  return toInstant(addLocalDays(date, 1), 0);
}

/** A UTC instant expressed as minutes from local midnight on `date`. */
export function instantToLocalMinutes(
  instant: Date,
  date: LocalDate,
): LocalMinutes {
  const dayStart = startOfLocalDay(date).getTime();
  return Math.round((instant.getTime() - dayStart) / 60_000);
}

/**
 * Clip a UTC interval to one local day and express it in local minutes.
 *
 * Returns null when the interval does not touch the day at all. Multi-day
 * periods such as a fortnight of leave are clipped to [0, 1440) for each day
 * they cover, which is what lets the pure engine work in plain integers without
 * knowing anything about dates.
 */
export function clipInstantsToLocalDay(
  start: Date,
  end: Date,
  date: LocalDate,
): Interval | null {
  const startMinutes = instantToLocalMinutes(start, date);
  const endMinutes = instantToLocalMinutes(end, date);
  const clippedStart = Math.max(0, startMinutes);
  const clippedEnd = Math.min(MINUTES_PER_DAY, endMinutes);
  if (clippedStart >= clippedEnd) return null;
  return { start: clippedStart, end: clippedEnd };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/** Minutes from local midnight as a 24 hour clock time, for example '14:30'. */
export function formatLocalMinutes(minutes: LocalMinutes): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** A duration in minutes as human readable text, for example '1 hr 30 min'. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hourLabel = `${hours} hr`;
  return mins === 0 ? hourLabel : `${hourLabel} ${mins} min`;
}

/** 'Thursday, 8 October 2026'. */
export function formatLocalDateLong(date: LocalDate): string {
  return format(parse(date, 'yyyy-MM-dd', new Date()), 'EEEE, d MMMM yyyy');
}

/** 'Thu 8 Oct'. */
export function formatLocalDateShort(date: LocalDate): string {
  return format(parse(date, 'yyyy-MM-dd', new Date()), 'EEE d MMM');
}

/** 'Thursday'. */
export function formatWeekday(date: LocalDate): string {
  return format(parse(date, 'yyyy-MM-dd', new Date()), 'EEEE');
}

/**
 * A date relative to today where that reads more naturally: 'Today',
 * 'Tomorrow', otherwise the weekday and date. Used by the availability widget.
 */
export function formatRelativeLocalDate(
  date: LocalDate,
  now: Date = new Date(),
): string {
  const today = todayLocalDate(now);
  if (date === today) return 'Today';
  if (date === addLocalDays(today, 1)) return 'Tomorrow';
  return formatLocalDateShort(date);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
