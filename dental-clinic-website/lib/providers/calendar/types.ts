import type { ProviderResult } from '../result';

/**
 * Calendar provider interface.
 *
 * The default implementation writes a downloadable calendar file and nothing
 * else, which needs no account, no OAuth consent screen and no network. Google
 * and Outlook adapters implement the same four methods later without the
 * booking interface changing.
 */

export interface CalendarBusyInterval {
  readonly start: Date;
  readonly end: Date;
  readonly source: string;
}

export interface GetAvailabilityInput {
  /** Our Dentist id. An adapter maps it to its own calendar id. */
  readonly calendarId: string;
  readonly from: Date;
  readonly to: Date;
}

export interface CalendarEventInput {
  readonly calendarId: string;
  /** Our Appointment id, so a repeated call does not duplicate the event. */
  readonly idempotencyKey: string;
  readonly title: string;
  readonly description?: string;
  readonly location?: string;
  readonly start: Date;
  readonly end: Date;
  readonly timeZone: string;
}

export interface CalendarEvent {
  readonly externalEventId: string;
  readonly htmlLink?: string;
}

export interface CalendarProvider {
  /** 'local', 'google', 'outlook'. */
  readonly name: string;
  readonly isConfigured: boolean;

  /**
   * External busy time to fold into availability as extra blocks.
   *
   * The local provider returns an empty list, because our own database is the
   * source of truth for the diary. Once a real calendar is connected, the
   * loader merges these into DentistDayInput.blocks, which already accepts
   * intervals from anywhere.
   */
  getAvailability(
    input: GetAvailabilityInput,
  ): Promise<ProviderResult<CalendarBusyInterval[]>>;

  createEvent(
    input: CalendarEventInput,
  ): Promise<ProviderResult<CalendarEvent>>;

  updateEvent(
    externalEventId: string,
    input: CalendarEventInput,
  ): Promise<ProviderResult<CalendarEvent>>;

  deleteEvent(externalEventId: string): Promise<ProviderResult<void>>;
}
