/**
 * Shared provider result type.
 *
 * Providers return results rather than throwing for expected failures, which
 * forces every call site to deal with the "it did not work" branch instead of
 * letting an unhandled rejection take down a booking.
 */

export interface ProviderError {
  readonly code:
    | 'not_configured'
    | 'invalid_request'
    | 'declined'
    | 'network'
    | 'rate_limited'
    | 'not_found'
    | 'already_processed'
    | 'unknown';
  readonly message: string;
  readonly retryable: boolean;
  /** The provider's own error code, kept for support and reconciliation. */
  readonly providerCode?: string;
}

export type ProviderResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: ProviderError };

export function providerOk<T>(data: T): ProviderResult<T> {
  return { ok: true, data };
}

export function providerFail(error: ProviderError): ProviderResult<never> {
  return { ok: false, error };
}

export interface Money {
  readonly amountCents: number;
  readonly currency: 'ZAR';
}

export function zar(amountCents: number): Money {
  return { amountCents, currency: 'ZAR' };
}
