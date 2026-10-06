import type { Money, ProviderResult } from '../result';

/**
 * The payment seam.
 *
 * The shop sells without a gateway. An order completes as EFT or as payment on
 * collection, which is a real way to trade in South Africa and needs no
 * integration, no PCI scope and no card fields anywhere on the site.
 *
 * Adding a gateway means writing one implementation of this interface and
 * setting PAYMENT_PROVIDER. Nothing in the order flow changes, because the
 * order flow only ever talks to this shape.
 *
 * Two deliberate properties of the design:
 *
 * 1. `initiate` returns a redirect URL rather than taking card details. Every
 *    South African gateway worth using works this way, the customer enters
 *    their card on the gateway's own page, and this site therefore never
 *    touches a card number. That is not a limitation we are working around; it
 *    is the correct architecture and it is why there is no card form to build.
 *
 * 2. `verify` is what decides whether an order is paid, and it is called from
 *    the server against the provider's API. A redirect back carrying
 *    "status=success" is a URL the customer can type, so it is treated as a
 *    prompt to go and check, never as proof.
 */

export type PaymentIntentStatus =
  | 'pending'
  | 'awaiting_customer'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentIntent {
  /** The provider's id for this payment, stored on the order. */
  readonly providerReference: string;
  readonly status: PaymentIntentStatus;
  /** Where to send the customer, when the provider hosts the payment page. */
  readonly redirectUrl: string | null;
  /** What the customer should be told, in words they can act on. */
  readonly instruction: string;
}

export interface PaymentVerification {
  readonly status: PaymentIntentStatus;
  readonly paidAmount: Money | null;
  readonly paidAt: Date | null;
}

export interface InitiatePaymentArgs {
  readonly orderReference: string;
  readonly amount: Money;
  readonly customer: {
    readonly name: string;
    readonly email: string;
    readonly mobile: string;
  };
  /** Where the provider should send the customer afterwards. */
  readonly returnUrl: string;
  readonly cancelUrl: string;
}

export interface PaymentProvider {
  readonly name: string;
  /**
   * False when the provider needs configuration it has not been given. The
   * checkout reads this to decide which payment methods to offer, so an
   * unconfigured gateway is simply not offered rather than failing at the last
   * step of a purchase.
   */
  readonly isConfigured: boolean;
  /** True when the customer is sent to the provider to pay. */
  readonly isRedirectBased: boolean;

  initiate(args: InitiatePaymentArgs): Promise<ProviderResult<PaymentIntent>>;
  verify(providerReference: string): Promise<ProviderResult<PaymentVerification>>;
  refund(
    providerReference: string,
    amount: Money,
  ): Promise<ProviderResult<PaymentVerification>>;
}
