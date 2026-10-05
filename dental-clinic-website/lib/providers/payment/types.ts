import type { Money, ProviderResult } from '../result';
import type { PaymentStatus } from '@/lib/domain/enums';

/**
 * Payment provider interface.
 *
 * No card details ever pass through this application. A provider either
 * redirects the payer to a hosted checkout it owns, or it settles out of band
 * at the practice. There is no code path anywhere in this codebase that
 * accepts, transmits or stores a card number, which is deliberate: it keeps
 * the practice out of PCI scope entirely.
 *
 * Booking logic never imports a concrete provider. It asks the registry for
 * whatever is configured, which is what makes Yoco, PayFast, Peach or Ozow a
 * new file rather than a refactor.
 */

export interface CreatePaymentInput {
  /** Our own Payment row id. Replaying a request is therefore a no-op. */
  readonly idempotencyKey: string;
  readonly amount: Money;
  /** The booking reference, so it appears on the payer's statement. */
  readonly reference: string;
  readonly description: string;
  readonly kind: 'deposit' | 'order';
  readonly customer: {
    readonly name: string;
    readonly email: string;
    readonly mobile: string;
  };
  /** Where the provider returns the payer afterwards. */
  readonly returnUrl: string;
  readonly cancelUrl: string;
  /** Where the provider posts its result. */
  readonly webhookUrl: string;
}

export interface CreatePaymentOutput {
  readonly providerReference: string;
  readonly status: PaymentStatus;
  /**
   * Hosted checkout URL, or null when the provider settles out of band.
   * A null value is the signal for the interface to show payment instructions
   * rather than redirect anywhere.
   */
  readonly redirectUrl: string | null;
  /** Shown to the payer when settlement happens at the practice. */
  readonly instructions?: string;
}

export interface VerifyPaymentInput {
  readonly providerReference: string;
  /** Raw body and headers, so an adapter can verify its own signature. */
  readonly rawBody?: string;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface VerifyPaymentOutput {
  readonly providerReference: string;
  readonly status: PaymentStatus;
  readonly amount: Money;
  /** Our reference echoed back, for reconciliation. */
  readonly reference: string | null;
  readonly paidAt: Date | null;
  /**
   * False means the caller MUST reject the callback. Anyone can post to a
   * webhook URL, so an unsigned or badly signed payload is not evidence of
   * anything.
   */
  readonly signatureValid: boolean;
}

export interface RefundPaymentInput {
  readonly idempotencyKey: string;
  readonly providerReference: string;
  /** Omit for a full refund. */
  readonly amount?: Money;
  readonly reason?: string;
}

export interface RefundPaymentOutput {
  readonly providerRefundReference: string;
  readonly status: 'pending' | 'refunded' | 'failed';
  readonly refundedAmount: Money;
}

export interface PaymentProvider {
  /** 'manual', 'yoco', 'payfast', 'peach', 'ozow'. */
  readonly name: string;
  /**
   * Whether this provider can take a payment online right now.
   *
   * False is a perfectly valid state and not an error: the booking flow then
   * offers settlement at the practice instead of a card redirect. The site is
   * fully usable with no payment provider configured at all.
   */
  readonly canTakePaymentOnline: boolean;
  /** Ozow instant EFT, for example, has no programmatic refund. */
  readonly supportsRefunds: boolean;

  createPayment(
    input: CreatePaymentInput,
  ): Promise<ProviderResult<CreatePaymentOutput>>;

  verifyPayment(
    input: VerifyPaymentInput,
  ): Promise<ProviderResult<VerifyPaymentOutput>>;

  refundPayment(
    input: RefundPaymentInput,
  ): Promise<ProviderResult<RefundPaymentOutput>>;
}
