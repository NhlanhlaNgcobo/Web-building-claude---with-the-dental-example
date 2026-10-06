import { Condition } from '@/lib/domain/enums';
import type { ProductFilters, ProductSort } from './queries';

/**
 * Turn URL search params into catalogue filters.
 *
 * Everything here is defensive on purpose: these values come from the address
 * bar, so anybody can type anything into them. An unknown condition, a
 * negative price or a sort that does not exist all fall back to the default
 * rather than reaching a query, which is why a hand-edited URL cannot produce
 * an error page.
 */

const SORTS: readonly ProductSort[] = [
  'featured',
  'price_asc',
  'price_desc',
  'newest',
];

export type RawSearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseConditions(
  value: string | string[] | undefined,
): Condition[] {
  const raw = one(value);
  if (!raw) return [];
  const wanted = new Set(raw.split(',').map((s) => s.trim()));
  // Filtered against the known list rather than cast, so a junk value is
  // dropped instead of reaching the database as a condition nobody has.
  return Condition.values.filter((c) => wanted.has(c));
}

export function parsePriceBand(value: string | string[] | undefined): {
  minPriceCents?: number;
  maxPriceCents?: number;
} {
  const raw = one(value);
  if (!raw) return {};
  const [min, max] = raw.split('-');
  const result: { minPriceCents?: number; maxPriceCents?: number } = {};
  if (min && /^\d+$/.test(min)) result.minPriceCents = Number(min);
  if (max && /^\d+$/.test(max)) result.maxPriceCents = Number(max);
  // A reversed band would silently return nothing, which looks like a bug to
  // the person who typed it. Swapping is the kinder reading.
  if (
    result.minPriceCents !== undefined &&
    result.maxPriceCents !== undefined &&
    result.minPriceCents > result.maxPriceCents
  ) {
    return {
      minPriceCents: result.maxPriceCents,
      maxPriceCents: result.minPriceCents,
    };
  }
  return result;
}

export function parseSort(value: string | string[] | undefined): ProductSort {
  const raw = one(value);
  return SORTS.find((s) => s === raw) ?? 'featured';
}

export function filtersFromParams(
  params: RawSearchParams,
  categorySlug?: string,
): ProductFilters {
  return {
    ...(categorySlug ? { categorySlug } : {}),
    conditions: parseConditions(params.condition),
    sort: parseSort(params.sort),
    ...parsePriceBand(params.price),
  };
}

/** A stable key for the filter state, used to remount the grid on change. */
export function filterKey(params: RawSearchParams): string {
  return [one(params.condition) ?? '', one(params.price) ?? '', one(params.sort) ?? '']
    .join('|');
}
