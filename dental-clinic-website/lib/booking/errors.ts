import type { SlotDto } from '@/types';

/**
 * Typed booking errors.
 *
 * Each one carries what the interface needs to recover: a slot collision
 * arrives with real alternative times, so the UI can offer them immediately
 * rather than sending the patient back to an empty calendar.
 */

export type BookingErrorCode =
  | 'SLOT_TAKEN'
  | 'SLOT_INVALID'
  | 'SERVICE_UNAVAILABLE'
  | 'DENTIST_INELIGIBLE'
  | 'NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'CANCELLATION_WINDOW_CLOSED'
  | 'RESCHEDULE_LIMIT_REACHED'
  | 'REFERENCE_GENERATION_FAILED'
  | 'OUT_OF_STOCK';

export class BookingError extends Error {
  readonly code: BookingErrorCode;
  readonly status: number;
  readonly alternatives: readonly SlotDto[];

  constructor(
    code: BookingErrorCode,
    message: string,
    options: { status?: number; alternatives?: readonly SlotDto[] } = {},
  ) {
    super(message);
    this.name = 'BookingError';
    this.code = code;
    this.status = options.status ?? 400;
    this.alternatives = options.alternatives ?? [];
  }
}

/**
 * The slot was free when it was displayed and has been taken since.
 *
 * The message is the one the specification calls for, and the alternatives are
 * recalculated at the moment of failure so they are genuinely still available.
 */
export class SlotTakenError extends BookingError {
  constructor(alternatives: readonly SlotDto[] = []) {
    super(
      'SLOT_TAKEN',
      'That appointment has just been booked. Please choose another available time.',
      { status: 409, alternatives },
    );
    this.name = 'SlotTakenError';
  }
}

/**
 * The requested time was never valid: outside opening hours, during lunch, in
 * the past, inside a blocked period, or off the slot grid.
 */
export class SlotInvalidError extends BookingError {
  constructor(
    message = 'That time is not available. Please choose one of the available times.',
    alternatives: readonly SlotDto[] = [],
  ) {
    super('SLOT_INVALID', message, { status: 409, alternatives });
    this.name = 'SlotInvalidError';
  }
}

export class BookingNotFoundError extends BookingError {
  constructor() {
    // Deliberately identical whether the reference does not exist or the
    // verification details do not match, so the endpoint cannot be used to
    // discover which references are real.
    super('NOT_FOUND', 'No booking found with those details.', { status: 404 });
    this.name = 'BookingNotFoundError';
  }
}

export class InvalidTransitionError extends BookingError {
  constructor(from: string, to: string) {
    super(
      'INVALID_TRANSITION',
      `An appointment that is ${from} cannot be marked ${to}.`,
      { status: 409 },
    );
    this.name = 'InvalidTransitionError';
  }
}

export class CancellationWindowClosedError extends BookingError {
  constructor(noticeHours: number) {
    super(
      'CANCELLATION_WINDOW_CLOSED',
      `Appointments can be cancelled online up to ${noticeHours} hours beforehand. Please phone the practice so we can help.`,
      { status: 409 },
    );
    this.name = 'CancellationWindowClosedError';
  }
}

export function isBookingError(error: unknown): error is BookingError {
  return error instanceof BookingError;
}
