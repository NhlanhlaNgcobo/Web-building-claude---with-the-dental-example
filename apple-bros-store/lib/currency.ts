/**
 * Money formatting.
 *
 * Amounts are stored as integer cents throughout, so there is no floating point
 * arithmetic anywhere near a price. These helpers are the only place cents
 * become a displayable string.
 */

const ZAR = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ZAR_WHOLE = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 'R1 250,00' */
export function formatCents(cents: number): string {
  return ZAR.format(cents / 100);
}

/**
 * 'R1 250' when the amount is a whole number of Rand, otherwise with cents.
 * Used for displayed prices, where trailing zeros are visual noise.
 */
export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? ZAR_WHOLE.format(cents / 100) : formatCents(cents);
}

/** 'From R1 250', or a fallback where the fee follows an assessment. */
export function formatPriceFrom(
  cents: number | null,
  fallback = 'Quoted after assessment',
): string {
  return cents === null ? fallback : `From ${formatPrice(cents)}`;
}

/** Parse a Rand amount typed by staff into cents. Returns null when invalid. */
export function parseRandToCents(input: string): number | null {
  const cleaned = input.replace(/[\sR]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number.parseFloat(cleaned) * 100);
}
