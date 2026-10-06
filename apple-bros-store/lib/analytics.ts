/**
 * Analytics.
 *
 * A typed event vocabulary with pluggable sinks. Nothing leaves the browser
 * today: the default sink logs to the console in development and is silent in
 * production. Connecting Google Analytics, Meta Pixel or anything else means
 * adding a sink, not touching a single call site.
 *
 * Note what is deliberately absent from every payload below: no name, no email,
 * no delivery address, no order reference. A purchase is reported by variant id
 * and value, which is what is useful for understanding the funnel and is not
 * personal information. That matters under POPIA and it also means these events
 * can be sent to a third party without a further consent question.
 */

export type AnalyticsEvent =
  | { name: 'page_view'; path: string; title?: string }
  | { name: 'product_viewed'; productSlug: string; variantId: string }
  | { name: 'variant_changed'; productSlug: string; variantId: string }
  | { name: 'category_viewed'; categorySlug: string; resultCount: number }
  | { name: 'filter_applied'; conditions: string[]; priceBand: string | null }
  | {
      name: 'add_to_basket';
      variantId: string;
      productSlug: string;
      quantity: number;
      valueCents: number;
    }
  | { name: 'remove_from_basket'; variantId: string; quantity: number }
  | { name: 'basket_viewed'; itemCount: number; valueCents: number }
  | { name: 'checkout_started'; itemCount: number; valueCents: number }
  | { name: 'fulfilment_selected'; method: string }
  | { name: 'payment_method_selected'; method: string }
  | {
      name: 'order_placed';
      itemCount: number;
      valueCents: number;
      fulfilment: string;
      paymentMethod: string;
      usedTradeIn: boolean;
    }
  | { name: 'checkout_failed'; reason: string }
  | { name: 'trade_in_started'; source: string }
  | { name: 'trade_in_quoted'; modelSlug: string; valueCents: number; accepted: boolean }
  | { name: 'trade_in_declined'; modelSlug: string; reason: string }
  | { name: 'order_lookup'; found: boolean }
  // resultCount is absent when the event fires from the search box, which
  // does not know the answer yet. Reported by the results page instead.
  | { name: 'search_performed'; query: string; resultCount?: number }
  | { name: 'contact_clicked'; channel: 'telephone' | 'email' | 'directions' }
  | { name: 'whatsapp_clicked'; intent: string }
  | { name: 'grading_viewed'; source: string };

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
  isEnabled: Boolean(process.env.NEXT_PUBLIC_GA4_ID),
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
