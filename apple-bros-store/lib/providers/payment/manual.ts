import { providerOk, zar } from '../result';
import type { PaymentProvider } from './types';

/**
 * Payment without a gateway.
 *
 * This is the default and it is not a placeholder. An order placed through it
 * is a real order: the stock is committed, the reference is issued, and the
 * shop is expecting either an EFT or the customer at the counter. Plenty of
 * South African retailers trade exactly like this.
 *
 * What it does not do is claim money has arrived. `initiate` returns
 * 'pending', `verify` returns 'pending', and the order sits in
 * awaiting_payment until somebody at the shop confirms the EFT landed. That
 * honesty is the whole point: an order that marked itself paid would be
 * lying to the shop about its own bank balance.
 */

function bankDetails(): readonly string[] | null {
  const name = process.env.EFT_BANK_NAME;
  const account = process.env.EFT_ACCOUNT_NAME;
  const number = process.env.EFT_ACCOUNT_NUMBER;
  const branch = process.env.EFT_BRANCH_CODE;

  // All or nothing. A half-filled block on a payment instruction is worse than
  // no block, because the customer cannot tell which half is missing.
  if (!name || !account || !number || !branch) return null;
  return [
    `Bank: ${name}`,
    `Account name: ${account}`,
    `Account number: ${number}`,
    `Branch code: ${branch}`,
  ];
}

export function manualPaymentInstruction(orderReference: string): string {
  const details = bankDetails();
  if (details === null) {
    return `We will email the banking details for order ${orderReference} shortly. Use the order number as your payment reference, and we will confirm as soon as it reflects.`;
  }
  return `Transfer the total to ${details.join(', ')}. Use ${orderReference} as your payment reference so we can match it, and we will confirm as soon as it reflects.`;
}

export const manualPaymentProvider: PaymentProvider = {
  name: 'manual',
  // Always usable, because it needs nothing configured.
  isConfigured: true,
  isRedirectBased: false,

  async initiate({ orderReference }) {
    return providerOk({
      providerReference: orderReference,
      status: 'pending',
      redirectUrl: null,
      instruction: manualPaymentInstruction(orderReference),
    });
  },

  async verify() {
    // Nothing to ask. Confirmation happens in the staff area when the money is
    // seen in the account.
    return providerOk({
      status: 'pending',
      paidAmount: null,
      paidAt: null,
    });
  },

  async refund(_reference, amount) {
    // Recorded as refunded so the order history is right; the transfer back is
    // made by a human from the bank account.
    return providerOk({
      status: 'refunded',
      paidAmount: zar(amount.amountCents),
      paidAt: new Date(),
    });
  },
};
