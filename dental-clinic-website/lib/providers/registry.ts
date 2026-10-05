import 'server-only';

import { manualPaymentProvider } from './payment/manual';
import { icsCalendarProvider } from './calendar/ics';
import { logNotificationProvider } from './notification/log';
import type { PaymentProvider } from './payment/types';
import type { CalendarProvider } from './calendar/types';
import type { NotificationProvider } from './notification/types';

/**
 * Provider registry.
 *
 * Booking logic asks for providers here and never imports a concrete one, so
 * adding a real gateway, calendar or message transport is a new file plus an
 * environment variable.
 *
 * Every default below is fully functional with no configuration. The site is
 * not in a degraded state out of the box: deposits are settled at the
 * practice, appointments download as calendar files, and notifications are
 * written to the server log.
 *
 * To add a provider:
 *   1. Implement the interface in a sibling file.
 *   2. Register the factory in the matching map below.
 *   3. Set PAYMENT_PROVIDER, CALENDAR_PROVIDER or NOTIFICATION_PROVIDER.
 */

export interface Providers {
  readonly payment: PaymentProvider;
  readonly calendar: CalendarProvider;
  readonly notifications: NotificationProvider;
}

const paymentRegistry: Record<string, () => PaymentProvider> = {
  manual: () => manualPaymentProvider,
  // Each of these is a file implementing PaymentProvider. Notes for whoever
  // builds them, so the work is not rediscovered:
  //
  // yoco:    Yoco Checkout. Amounts are already in cents, matching Money.
  //          Verify the webhook HMAC from the signature header.
  // payfast: The ITN callback is form encoded rather than JSON, and must be
  //          validated by signature AND source IP, then confirmed back to
  //          PayFast. All of that belongs in verifyPayment.
  // peach:   Peach Payments Checkout. Two step: create, then poll status.
  // ozow:    Instant EFT. Set supportsRefunds to false so the refund path
  //          degrades to a manual task rather than failing silently.
};

const calendarRegistry: Record<string, () => CalendarProvider> = {
  local: () => icsCalendarProvider,
  // google:  Google Calendar API with a service account, or OAuth per
  //          dentist. getAvailability maps to freeBusy.query.
  // outlook: Microsoft Graph /me/calendar, or /users/{id}/calendar.
};

const notificationRegistry: Record<string, () => NotificationProvider> = {
  log: () => logNotificationProvider,
  // Any transactional email or SMS transport implements NotificationProvider.
  // South African practices commonly use a local SMS aggregator for reminders
  // and WhatsApp Business for confirmations.
};

function pick<T>(
  registry: Record<string, () => T>,
  envKey: string,
  fallback: string,
  label: string,
): T {
  const name = process.env[envKey] ?? fallback;
  const factory = registry[name];
  if (!factory) {
    // Loud, but not fatal. A typo in an environment variable must not take
    // the booking system offline.
    console.error(
      `[providers] Unknown ${label} provider "${name}". Known: ${Object.keys(registry).join(', ')}. Falling back to "${fallback}".`,
    );
    return registry[fallback]!();
  }
  return factory();
}

let cached: Providers | null = null;

/**
 * Memoised, because a real adapter holds an HTTP client that should not be
 * rebuilt per request.
 */
export function getProviders(): Providers {
  return (cached ??= {
    payment: pick(paymentRegistry, 'PAYMENT_PROVIDER', 'manual', 'payment'),
    calendar: pick(calendarRegistry, 'CALENDAR_PROVIDER', 'local', 'calendar'),
    notifications: pick(
      notificationRegistry,
      'NOTIFICATION_PROVIDER',
      'log',
      'notification',
    ),
  });
}
