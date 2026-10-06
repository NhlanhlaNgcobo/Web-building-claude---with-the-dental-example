import { CONDITION_ORDER, type Condition } from '@/lib/domain/enums';

/**
 * Catalogue pricing. Pure functions, no I/O, no Prisma import.
 *
 * Every amount is integer cents in South African Rand, and every displayed
 * price includes VAT, which is what a consumer in South Africa expects to
 * see. The VAT breakdown is derived for the invoice rather than added at
 * checkout, so the number on the product page is the number that is paid.
 */

/** South African VAT, as a percentage, applied inclusively. */
export const VAT_PERCENT = 15;

export interface PricedVariant {
  readonly id: string;
  readonly condition: Condition;
  readonly storageGb: number | null;
  readonly colourName: string;
  readonly priceCents: number;
  readonly compareAtCents: number | null;
  readonly stockQuantity: number;
  readonly isActive: boolean;
}

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

/** A variant a customer can actually buy right now. */
export function isBuyable(variant: PricedVariant): boolean {
  return variant.isActive && variant.stockQuantity > 0;
}

export function buyableVariants(
  variants: readonly PricedVariant[],
): PricedVariant[] {
  return variants.filter(isBuyable);
}

/* ------------------------------------------------------------------ */
/* Headline price                                                      */
/* ------------------------------------------------------------------ */

/**
 * The "from" price shown on a product card.
 *
 * Taken from variants that are genuinely in stock. Advertising a price for a
 * configuration nobody can buy is the most common dishonesty in refurbished
 * electronics, and it is the thing that makes a shopper stop trusting a
 * catalogue.
 *
 * Returns null when nothing is buyable, which the card renders as out of
 * stock rather than as a price.
 */
export function fromPriceCents(
  variants: readonly PricedVariant[],
): number | null {
  const buyable = buyableVariants(variants);
  if (buyable.length === 0) return null;
  return Math.min(...buyable.map((v) => v.priceCents));
}

/** The highest buyable price, for showing a range on a card. */
export function toPriceCents(
  variants: readonly PricedVariant[],
): number | null {
  const buyable = buyableVariants(variants);
  if (buyable.length === 0) return null;
  return Math.max(...buyable.map((v) => v.priceCents));
}

/* ------------------------------------------------------------------ */
/* Savings                                                             */
/* ------------------------------------------------------------------ */

export interface Saving {
  readonly amountCents: number;
  readonly percent: number;
}

/**
 * The saving against the comparison price.
 *
 * Returns null unless the comparison is genuine and material. Three guards,
 * each there for a reason:
 *
 *   - No comparison price set means no claim to make.
 *   - A comparison at or below the selling price is not a saving, and
 *     showing one would be a lie.
 *   - Under one percent is noise. Rounding it up to "1% off" to have a badge
 *     is the kind of thing that makes a whole page feel untrustworthy.
 */
export function savingFor(variant: {
  priceCents: number;
  compareAtCents: number | null;
}): Saving | null {
  const { priceCents, compareAtCents } = variant;
  if (compareAtCents === null) return null;
  if (compareAtCents <= priceCents) return null;

  const amountCents = compareAtCents - priceCents;
  const percent = Math.round((amountCents / compareAtCents) * 100);
  if (percent < 1) return null;

  return { amountCents, percent };
}

/** The best genuine saving across buyable variants, for a card badge. */
export function bestSaving(
  variants: readonly PricedVariant[],
): Saving | null {
  const savings = buyableVariants(variants)
    .map((v) => savingFor(v))
    .filter((s): s is Saving => s !== null);
  if (savings.length === 0) return null;
  return savings.reduce((best, s) => (s.percent > best.percent ? s : best));
}

/* ------------------------------------------------------------------ */
/* VAT                                                                 */
/* ------------------------------------------------------------------ */

export interface VatBreakdown {
  readonly exclusiveCents: number;
  readonly vatCents: number;
  readonly inclusiveCents: number;
}

/**
 * Split a VAT-inclusive amount for the invoice.
 *
 * The VAT portion is derived from the inclusive total and the exclusive
 * amount is the remainder, rather than both being rounded independently.
 * Rounding each separately is how an invoice ends up one cent short of its
 * own total.
 */
export function vatBreakdown(inclusiveCents: number): VatBreakdown {
  const vatCents = Math.round(
    inclusiveCents - inclusiveCents / (1 + VAT_PERCENT / 100),
  );
  return {
    exclusiveCents: inclusiveCents - vatCents,
    vatCents,
    inclusiveCents,
  };
}

/* ------------------------------------------------------------------ */
/* Variant selection                                                   */
/* ------------------------------------------------------------------ */

/**
 * Order variants for display: best condition first, then largest storage,
 * then cheapest. Stable, so the same product always renders the same way.
 */
export function sortVariantsForDisplay<T extends PricedVariant>(
  variants: readonly T[],
): T[] {
  return [...variants].sort(
    (a, b) =>
      CONDITION_ORDER.indexOf(a.condition) -
        CONDITION_ORDER.indexOf(b.condition) ||
      (b.storageGb ?? 0) - (a.storageGb ?? 0) ||
      a.priceCents - b.priceCents ||
      a.id.localeCompare(b.id),
  );
}

/**
 * The variant a product page should open on.
 *
 * The cheapest buyable one, because that is the price the card advertised and
 * landing on anything else makes the page feel like a bait and switch. Falls
 * back to the first variant for display when nothing is in stock, so the page
 * can still show specifications and a notify option.
 */
export function defaultVariant<T extends PricedVariant>(
  variants: readonly T[],
): T | null {
  if (variants.length === 0) return null;
  const buyable = variants.filter(isBuyable);
  if (buyable.length === 0) return sortVariantsForDisplay(variants)[0] ?? null;
  return buyable.reduce((cheapest, v) =>
    v.priceCents < cheapest.priceCents ||
    (v.priceCents === cheapest.priceCents && v.id < cheapest.id)
      ? v
      : cheapest,
  );
}

/**
 * Find the variant matching a chosen storage, colour and condition.
 *
 * Returns null rather than a near match. Silently substituting a different
 * configuration is how somebody receives the wrong device.
 */
export function findVariant<T extends PricedVariant>(
  variants: readonly T[],
  selection: {
    readonly storageGb: number | null;
    readonly colourName: string;
    readonly condition: Condition;
  },
): T | null {
  return (
    variants.find(
      (v) =>
        v.storageGb === selection.storageGb &&
        v.colourName === selection.colourName &&
        v.condition === selection.condition,
    ) ?? null
  );
}

/* ------------------------------------------------------------------ */
/* Option availability                                                 */
/* ------------------------------------------------------------------ */

/**
 * Which options remain buyable given a partial selection.
 *
 * This is what lets the product page disable a colour that does not exist in
 * the chosen storage size, rather than letting somebody pick an impossible
 * combination and only discovering it when the add button does nothing.
 */
export function availableOptions(
  variants: readonly PricedVariant[],
  selection: {
    readonly storageGb?: number | null;
    readonly colourName?: string;
    readonly condition?: Condition;
  },
): {
  readonly storage: readonly (number | null)[];
  readonly colours: readonly string[];
  readonly conditions: readonly Condition[];
} {
  const buyable = buyableVariants(variants);

  // Each dimension is filtered by the OTHER dimensions only. Including the
  // dimension itself would always return just the current choice, which would
  // make every other option look unavailable.
  const matching = (ignore: 'storage' | 'colour' | 'condition') =>
    buyable.filter(
      (v) =>
        (ignore === 'storage' ||
          selection.storageGb === undefined ||
          v.storageGb === selection.storageGb) &&
        (ignore === 'colour' ||
          selection.colourName === undefined ||
          v.colourName === selection.colourName) &&
        (ignore === 'condition' ||
          selection.condition === undefined ||
          v.condition === selection.condition),
    );

  const storage = [
    ...new Set(matching('storage').map((v) => v.storageGb)),
  ].sort((a, b) => (a ?? 0) - (b ?? 0));

  const colours = [...new Set(matching('colour').map((v) => v.colourName))].sort();

  const conditions = [
    ...new Set(matching('condition').map((v) => v.condition)),
  ].sort(
    (a, b) => CONDITION_ORDER.indexOf(a) - CONDITION_ORDER.indexOf(b),
  );

  return { storage, colours, conditions };
}
