import 'server-only';

import { formatPrice } from '@/lib/currency';
import { store } from '@/data/store';

/**
 * Notifications.
 *
 * The shop works with nothing configured: messages are written to the server
 * log, and every page that would have been emailed also exists on the site, so
 * nothing the customer needs is only ever in a message they may not receive.
 * That is why the order confirmation page shows the banking details and the
 * reference rather than saying "check your email".
 *
 * Add a real transport by writing one object of this shape and setting
 * NOTIFICATION_PROVIDER. Nothing that calls a notifier knows which one it has.
 */

export interface OrderPlacedMessage {
  readonly reference: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly totalCents: number;
  readonly fulfilment: string;
  readonly paymentInstruction: string | null;
}

export interface OrderStatusMessage {
  readonly reference: string;
  readonly customerEmail: string;
  readonly status: string;
  readonly note: string | null;
}

export interface TradeInQuotedMessage {
  readonly reference: string;
  readonly customerEmail: string;
  readonly deviceLabel: string;
  readonly valueCents: number;
  readonly expiresAt: Date;
}

export interface Notifier {
  readonly name: string;
  readonly isConfigured: boolean;
  orderPlaced(message: OrderPlacedMessage): Promise<void>;
  orderStatusChanged(message: OrderStatusMessage): Promise<void>;
  tradeInQuoted(message: TradeInQuotedMessage): Promise<void>;
}

/**
 * The default.
 *
 * Note that it logs the recipient and the reference but not the body of a
 * message. A server log is read by more people than an inbox is, so there is
 * no reason to put a customer's details into it.
 */
const logNotifier: Notifier = {
  name: 'log',
  isConfigured: true,

  async orderPlaced(message) {
    console.info(
      `[notify] order ${message.reference} placed, ${formatPrice(message.totalCents)}, confirmation would be sent to ${message.customerEmail}`,
    );
    if (message.paymentInstruction) {
      console.info(`[notify] payment instruction: ${message.paymentInstruction}`);
    }
  },

  async orderStatusChanged(message) {
    console.info(
      `[notify] order ${message.reference} is now ${message.status}, update would be sent to ${message.customerEmail}`,
    );
  },

  async tradeInQuoted(message) {
    console.info(
      `[notify] trade in ${message.reference} quoted at ${formatPrice(message.valueCents)} for a ${message.deviceLabel}, valid until ${message.expiresAt.toISOString().slice(0, 10)}`,
    );
  },
};

/**
 * Email, once a transport is configured.
 *
 * Left as a documented slot rather than a half-written client. The subjects and
 * the from address are here because they are decisions rather than plumbing,
 * and getting them right matters more than which API sends them:
 *
 *   Subject lines should lead with the reference, because a customer searching
 *   their inbox three weeks later searches for the number.
 *   From should be a real monitored address. A noreply address on an order
 *   confirmation is how a shop loses a sale it could have saved.
 *
 * With RESEND_API_KEY set, this is roughly twenty lines against their REST
 * endpoint. The interface above is what the rest of the code depends on, so
 * writing it changes nothing else.
 */
export const emailSubjects = {
  orderPlaced: (reference: string) =>
    `${reference}: we have your order at ${store.name}`,
  orderStatus: (reference: string, status: string) =>
    `${reference}: your order is now ${status.toLowerCase()}`,
  tradeInQuoted: (reference: string) =>
    `${reference}: your trade in figure from ${store.name}`,
} as const;

let cached: Notifier | null = null;

export function notifier(): Notifier {
  if (cached) return cached;

  const chosen = (process.env.NOTIFICATION_PROVIDER ?? 'log').toLowerCase();
  if (chosen !== 'log' && chosen !== '') {
    console.warn(
      `[notify] NOTIFICATION_PROVIDER is "${chosen}" but no transport is installed. Messages are being logged instead of sent.`,
    );
  }

  cached = logNotifier;
  return cached;
}
