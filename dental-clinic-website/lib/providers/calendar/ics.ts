import { providerOk } from '../result';
import type { CalendarEventInput, CalendarProvider } from './types';
import { clinic, formatAddressOneLine } from '@/data/clinic';

/**
 * Calendar file generation.
 *
 * The default calendar provider. It needs no account and no network: an
 * appointment becomes an .ics file the patient downloads, which Google
 * Calendar, Outlook and Apple Calendar all import. That covers the brief's
 * "add to calendar" requirement without an OAuth integration.
 *
 * It does not read external availability, because our own database is the
 * source of truth for the diary.
 */

/** Escape text for an iCalendar property value, per RFC 5545. */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** UTC timestamp in the basic format iCalendar requires. */
function toIcsUtc(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

/**
 * Fold lines at 75 octets, which the specification requires and which several
 * calendar clients enforce strictly enough to reject the file otherwise.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(` ${rest}`);
  return parts.join('\r\n');
}

export interface IcsEvent {
  readonly uid: string;
  readonly title: string;
  readonly description: string;
  readonly start: Date;
  readonly end: Date;
  readonly location?: string;
}

export function buildIcs(event: IcsEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${clinic.name}//Appointments//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(event.start)}`,
    `DTEND:${toIcsUtc(event.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(event.location ?? formatAddressOneLine())}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    // A day's notice, which is also our cancellation window.
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`Reminder: ${event.title}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

export const icsCalendarProvider: CalendarProvider = {
  name: 'local',
  isConfigured: true,

  async getAvailability() {
    // Our database is authoritative. Nothing external to merge.
    return providerOk([]);
  },

  async createEvent(input: CalendarEventInput) {
    // The calendar file is generated on request by the download route rather
    // than pushed anywhere, so there is no remote event to create.
    return providerOk({ externalEventId: `local_${input.idempotencyKey}` });
  },

  async updateEvent(externalEventId: string) {
    return providerOk({ externalEventId });
  },

  async deleteEvent() {
    return providerOk(undefined);
  },
};
