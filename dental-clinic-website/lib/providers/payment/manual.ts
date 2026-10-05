import { providerOk, zar } from '../result';
import type { PaymentProvider } from './types';

/**
 * The default payment provider: settlement at the practice.
 *
 * This is not a stub standing in for something missing. It is how a great many
 * South African dental practices actually take a deposit: the patient pays by
 * card at reception or by electronic transfer, and a staff member marks it
 * received in the diary. The whole booking flow works end to end with this
 * provider and nothing configured, which is the point.
 *
 * It records the intention to pay and returns no redirect URL. A null
 * redirectUrl is the signal the interface uses to show instructions instead of
 * sending the patient to a gateway.
 *
 * When the practice signs up with a gateway, a sibling file implements the same
 * interface and PAYMENT_PROVIDER in .env selects it. No booking code changes.
 */
export const manualPaymentProvider: PaymentProvider = {
  name: 'manual',
  canTakePaymentOnline: false,
  // Refunds are processed by a staff member, so the ledger can record one
  // even though no gateway is involved.
  supportsRefunds: true,

  async createPayment(input) {
    return providerOk({
      providerReference: `manual_${input.idempotencyKey}`,
      status: 'pending' as const,
      redirectUrl: null,
      instructions:
        'Your appointment is held. Pay the deposit by card at reception, or by electronic transfer using your booking reference, and we will confirm it.',
    });
  },

  async verifyPayment(input) {
    // There is no gateway to ask, so nothing can be verified automatically.
    // A staff member confirms receipt in the diary, which is an authenticated
    // action rather than an unauthenticated callback.
    return providerOk({
      providerReference: input.providerReference,
      status: 'pending' as const,
      amount: zar(0),
      reference: null,
      paidAt: null,
      signatureValid: true,
    });
  },

  async refundPayment(input) {
    return providerOk({
      providerRefundReference: `manual_refund_${input.idempotencyKey}`,
      status: 'pending' as const,
      refundedAmount: input.amount ?? zar(0),
    });
  },
};
