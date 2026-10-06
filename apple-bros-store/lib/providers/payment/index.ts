import type { PaymentMethod } from '@/lib/domain/enums';
import { manualPaymentProvider } from './manual';
import type { PaymentProvider } from './types';

export type { PaymentProvider, PaymentIntent, PaymentVerification } from './types';
export { manualPaymentInstruction } from './manual';

/**
 * Provider selection.
 *
 * One place reads PAYMENT_PROVIDER and hands back something that satisfies the
 * interface. Everything else in the codebase asks for `paymentProvider()` and
 * does not know or care which one it got.
 *
 * ---------------------------------------------------------------------------
 * Adding a gateway
 * ---------------------------------------------------------------------------
 *
 * Write a file next to manual.ts exporting a PaymentProvider, add it to the
 * switch, and set PAYMENT_PROVIDER. The notes below are the specifics that
 * caught us out when reading each provider's documentation, recorded so the
 * next person does not have to find them again.
 *
 * Yoco (https://developer.yoco.com)
 *   Checkout API. POST /checkouts with amountInCents and currency ZAR, then
 *   redirect to redirectUrl. Keys are secret, never put one in a
 *   NEXT_PUBLIC_ variable. Verify by GET /checkouts/{id}, and treat the
 *   webhook as a nudge to verify rather than as the truth.
 *
 * PayFast (https://developers.payfast.co.za)
 *   Form POST to the process endpoint with an md5 signature over the fields in
 *   the order they were submitted, which is the part that catches everybody:
 *   reordering the fields changes the signature. Confirmation arrives as an
 *   ITN callback that must be validated against PayFast's own IP range and
 *   then confirmed with a server-to-server query.
 *
 * Peach Payments (https://developer.peachpayments.com)
 *   Checkout flow, entityId plus a bearer token. Amounts are decimal strings,
 *   not cents, so convert carefully; this is where rounding bugs come from.
 *
 * Ozow (https://ozow.com/integrations)
 *   Instant EFT, no card. A SHA512 hash of the concatenated request fields,
 *   lowercased before hashing. Verify with the transaction status API; the
 *   redirect carries no proof.
 *
 * For all four: the redirect back is a URL the customer can type by hand, so
 * it may only trigger a server-side verify. Never mark an order paid from a
 * query parameter.
 */

let cached: PaymentProvider | null = null;

export function paymentProvider(): PaymentProvider {
  if (cached) return cached;

  const chosen = (process.env.PAYMENT_PROVIDER ?? 'manual').toLowerCase();

  switch (chosen) {
    case 'yoco':
    case 'payfast':
    case 'peach':
    case 'ozow':
      // Deliberately falls through to manual until an adapter is written.
      // Silently pretending to charge a card would be worse than taking the
      // order as an EFT, which is a real and working way to be paid.
      console.warn(
        `[payments] PAYMENT_PROVIDER is "${chosen}" but no adapter is installed. Falling back to EFT and payment on collection.`,
      );
      cached = manualPaymentProvider;
      return cached;
    case 'manual':
    default:
      cached = manualPaymentProvider;
      return cached;
  }
}

/**
 * Which payment methods checkout should offer.
 *
 * Driven by what is actually configured, so the customer is never shown a
 * method that cannot complete. Card appears only once a redirect-based gateway
 * is wired up.
 */
export function availablePaymentMethods(): readonly PaymentMethod[] {
  const provider = paymentProvider();
  const methods: PaymentMethod[] = ['eft', 'card_on_collection'];
  if (provider.isRedirectBased && provider.isConfigured) methods.unshift('gateway');
  return methods;
}
