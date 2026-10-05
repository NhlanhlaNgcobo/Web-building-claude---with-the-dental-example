/**
 * Pure types for the availability engine.
 *
 * This module has ZERO imports, and that is deliberate. The engine core speaks
 * only in integers and strings: a recurring "08:00" is a wall-clock fact rather
 * than an instant, so it is represented as minutes from local midnight. All
 * timezone conversion happens at the loader boundary (lib/availability/tz.ts),
 * which is what makes the core trivially testable without a database, a
 * timezone library, or a frozen clock.
 */

/** Minutes elapsed since local midnight. 480 = 08:00, 1020 = 17:00. */
export type LocalMinutes = number;

/** A local calendar date as 'YYYY-MM-DD'. Never a Date object inside the core. */
export type LocalDate = string;

/** 0 = Sunday through 6 = Saturday, matching JavaScript's Date#getDay. */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A half-open interval [start, end) in local minutes.
 * Invariant: start < end. Zero-length and inverted intervals are rejected at
 * the loader boundary so they can never reach the core.
 */
export interface Interval {
  readonly start: LocalMinutes;
  readonly end: LocalMinutes;
}

/**
 * One dentist's shape for a single day, already flattened to local minutes.
 *
 * `breaks` is kept separate from `workingWindows` rather than pre-subtracted,
 * because the engine needs to distinguish "fully booked" from "that is lunch"
 * in order to write honest empty-state copy and drive the admin calendar.
 */
export interface DentistDayInput {
  readonly dentistId: string;
  /** Deterministic tie-break key for 'any available dentist'. Lower wins. */
  readonly sortOrder: number;
  /** Working windows for this weekday. Usually one, two for a split shift. */
  readonly workingWindows: readonly Interval[];
  /** Lunch and other recurring breaks inside the working window. */
  readonly breaks: readonly Interval[];
  /** Existing non-cancelled appointments, clipped to this local day. */
  readonly busy: readonly Interval[];
  /** Dentist-specific and clinic-wide blocks, clipped to this local day. */
  readonly blocks: readonly Interval[];
  /** Per-dentist duration override, where one dentist takes longer or less. */
  readonly durationMinutesOverride?: number;
}

/** The complete input to the pure core. Nothing else is read. */
export interface AvailabilityInput {
  readonly date: LocalDate;
  readonly dayOfWeek: DayOfWeek;
  /** Clinic opening window for this weekday, or null when the clinic is closed. */
  readonly clinicHours: Interval | null;
  /** Only dentists eligible for the requested service. Filtered by the loader. */
  readonly dentists: readonly DentistDayInput[];
  /** Chair time in minutes. */
  readonly serviceDurationMinutes: number;
  /** Turnaround appended after the appointment. Part of the reserved interval. */
  readonly bufferAfterMinutes: number;
  /** Candidate start grid step in minutes. */
  readonly granularityMinutes: number;
  /**
   * Where `date` sits relative to the clinic's current day.
   *
   * This is explicit rather than inferred from `nowLocalMinutes` being null,
   * because conflating "yesterday" with "next week" is exactly the kind of
   * ambiguity that lets a booking be accepted for a date that has already
   * passed.
   */
  readonly dayPosition: 'past' | 'today' | 'future';
  /**
   * Current time in the clinic's local frame. Only meaningful when
   * `dayPosition` is 'today'; the loader guarantees 0 <= value < 1440.
   */
  readonly nowLocalMinutes: LocalMinutes | null;
  /** Earliest bookable offset from now, in minutes. */
  readonly minimumLeadTimeMinutes: number;
}

/** A bookable appointment slot. */
export interface Slot {
  readonly date: LocalDate;
  readonly startMinutes: LocalMinutes;
  /** Chair end, excluding turnaround buffer. This is what the patient sees. */
  readonly endMinutes: LocalMinutes;
  /** The dentist resolved for this slot. */
  readonly dentistId: string;
  /**
   * Other eligible dentists also free at this exact time, in tie-break order.
   * The booking transaction falls through these when the first choice is taken
   * between the slot being displayed and the booking being confirmed.
   * Empty when a specific dentist was requested.
   */
  readonly alternateDentistIds: readonly string[];
}

/**
 * Why a day produced no slots. Drives the empty-state copy, so that a closed
 * Sunday reads differently from a fully booked Wednesday.
 */
export type DayUnavailableReason =
  | 'clinic_closed'
  | 'no_eligible_dentist'
  | 'no_dentist_working'
  /** Working time exists but is entirely blocked off, such as a public
   *  holiday or a day of leave. Distinct from fully_booked, because the two
   *  mean different things to a patient. */
  | 'blocked'
  | 'fully_booked'
  | 'all_slots_in_past';

export interface DayAvailability {
  readonly date: LocalDate;
  readonly slots: readonly Slot[];
  /** Set if and only if slots is empty. */
  readonly unavailableReason: DayUnavailableReason | null;
}
