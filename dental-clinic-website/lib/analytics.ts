/**
 * Analytics.
 *
 * A typed event vocabulary with pluggable sinks. Nothing leaves the browser
 * today: the default sink logs to the console in development and is silent in
 * production. Connecting Google Analytics, Meta Pixel or anything else means
 * adding a sink, not touching a single call site.
 *
 * Events carry no patient-identifying information. Note what is deliberately
 * absent from the payloads below: no name, no email, no mobile number, no
 * booking reference. A booking is reported by service and dentist id, which is
 * what is useful for understanding the funnel and is not personal data.
 */

export type AnalyticsEvent =
  | { name: 'page_view'; path: string; title?: string }
  | { name: 'service_view'; slug: string; category?: string }
  | { name: 'booking_started'; entryPoint: string; serviceSlug?: string }
  | { name: 'service_selected'; serviceId: string; serviceSlug: string }
  | { name: 'dentist_selected'; dentistId: string | 'any' }
  | { name: 'date_selected'; date: string }
  | { name: 'time_selected'; date: string; startMinutes: number }
  | { name: 'booking_details_completed' }
  | { name: 'deposit_selected'; choice: 'pay_now' | 'pay_at_appointment' }
  | {
      name: 'booking_completed';
      serviceId: string;
      dentistId: string;
      depositType: string;
      isEmergency: boolean;
    }
  | { name: 'booking_failed'; reason: string }
  | { name: 'product_viewed'; slug: string }
  | { name: 'product_added'; slug: string; quantity: number }
  | { name: 'upsell_shown'; context: string; productSlugs: string[] }
  | { name: 'upsell_accepted'; context: string; productSlug: string }
  | { name: 'contact_clicked'; channel: 'telephone' | 'email' | 'directions' }
  | { name: 'whatsapp_clicked'; intent: string }
  | { name: 'search_performed'; query: string; resultCount: number }
  | { name: 'emergency_viewed'; source: string };

export type AnalyticsEventName = AnalyticsEvent['name'];

/** A destination for events. Add one per platform. */
export interface AnalyticsSink {
  readonly name: string;
  readonly isEnabled: boolean;
  track(event: AnalyticsEvent): void;
}

/* ------------------------------------------------------------------ */
/* Sinks                                                               */
/* ------------------------------------------------------------------ */

const consoleSink: AnalyticsSink = {
  name: 'console',
  isEnabled: process.env.NODE_ENV === 'development',
  track(event) {
    const { name, ...payload } = event;
    console.debug(`[analytics] ${name}`, payload);
  },
};

/**
 * Google Analytics 4.
 *
 * Enabled only when a measurement id is configured, so the default build sends
 * nothing anywhere. The script tag itself is not injected by this module; add
 * it to the root layout when the id is set.
 */
const googleAnalyticsSink: AnalyticsSink = {
  name: 'ga4',
  isEnabled: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
  track(event) {
    const gtag = (globalThis as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== 'function') return;
    const { name, ...payload } = event;
    gtag('event', name, payload);
  },
};

/**
 * Further sinks slot in here. Each one is responsible for its own enablement
 * check, so an unconfigured platform costs nothing at runtime.
 *
 * Meta Pixel, for example, would be:
 *   { name: 'meta', isEnabled: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
 *     track(event) { window.fbq?.('trackCustom', event.name, event); } }
 */
const sinks: readonly AnalyticsSink[] = [consoleSink, googleAnalyticsSink];

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function track(event: AnalyticsEvent): void {
  // Events are fired from interaction handlers, so a misbehaving sink must
  // never be able to break the interaction it was reporting on.
  for (const sink of sinks) {
    if (!sink.isEnabled) continue;
    try {
      sink.track(event);
    } catch {
      // Intentionally swallowed.
    }
  }
}

/** Convenience wrapper for the common case of tracking inside a handler. */
export function trackAnd<T>(event: AnalyticsEvent, then: () => T): T {
  track(event);
  return then();
}
