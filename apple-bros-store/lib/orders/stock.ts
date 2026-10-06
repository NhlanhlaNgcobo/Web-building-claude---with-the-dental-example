/**
 * Stock reasoning. Pure functions, no I/O, no Prisma import.
 *
 * These decide what a basket can be fulfilled with. The actual decrement
 * happens in lib/orders/service.ts inside a transaction, and is the only
 * thing that may change a quantity.
 */

export interface StockLine {
  readonly variantId: string;
  readonly quantity: number;
}

export interface StockLevel {
  readonly variantId: string;
  readonly stockQuantity: number;
  readonly isActive: boolean;
}

export type ShortfallReason = 'unavailable' | 'insufficient';

export interface Shortfall {
  readonly variantId: string;
  readonly requested: number;
  readonly available: number;
  readonly reason: ShortfallReason;
}

/**
 * Check a basket against known stock levels.
 *
 * Returns every shortfall rather than the first, because telling somebody
 * their basket has a problem one item at a time is maddening. The checkout
 * shows all of them at once with a suggested quantity for each.
 *
 * This is the display-time check. It is advisory: stock can change between
 * this call and the order being placed, which is exactly why the transaction
 * checks again and is the authority.
 */
export function findShortfalls(
  lines: readonly StockLine[],
  levels: readonly StockLevel[],
): Shortfall[] {
  const byId = new Map(levels.map((l) => [l.variantId, l]));
  const shortfalls: Shortfall[] = [];

  for (const line of lines) {
    const level = byId.get(line.variantId);

    // Missing or deactivated: the variant cannot be sold at all, which is a
    // different message from "we only have two left".
    if (!level || !level.isActive) {
      shortfalls.push({
        variantId: line.variantId,
        requested: line.quantity,
        available: 0,
        reason: 'unavailable',
      });
      continue;
    }

    if (level.stockQuantity < line.quantity) {
      shortfalls.push({
        variantId: line.variantId,
        requested: line.quantity,
        available: Math.max(level.stockQuantity, 0),
        reason: level.stockQuantity <= 0 ? 'unavailable' : 'insufficient',
      });
    }
  }

  return shortfalls;
}

/** Whether a basket can be fulfilled in full from these levels. */
export function canFulfil(
  lines: readonly StockLine[],
  levels: readonly StockLevel[],
): boolean {
  return findShortfalls(lines, levels).length === 0;
}

/**
 * Trim a basket to what is actually in stock.
 *
 * Used to offer a one-click fix at checkout: reduce the quantities and drop
 * what has gone, rather than making the customer edit each line themselves.
 */
export function trimToAvailable(
  lines: readonly StockLine[],
  levels: readonly StockLevel[],
): StockLine[] {
  const byId = new Map(levels.map((l) => [l.variantId, l]));

  return lines
    .map((line) => {
      const level = byId.get(line.variantId);
      if (!level || !level.isActive) return null;
      const quantity = Math.min(line.quantity, Math.max(level.stockQuantity, 0));
      return quantity > 0 ? { variantId: line.variantId, quantity } : null;
    })
    .filter((l): l is StockLine => l !== null);
}

/* ------------------------------------------------------------------ */
/* Stock messaging                                                     */
/* ------------------------------------------------------------------ */

export type StockState = 'out' | 'last_one' | 'low' | 'in_stock';

/** Below this, say how many are left. Above it, just say it is in stock. */
export const LOW_STOCK_THRESHOLD = 3;

/**
 * How to describe a stock level.
 *
 * "Only 2 left" is true and useful when there are genuinely two. The same
 * phrase on a warehouse of four hundred is a pressure tactic, and a shopper
 * who notices it stops believing anything else on the page. So the state is
 * derived from the real number and the copy for each state says only what is
 * true.
 */
export function stockState(quantity: number, isActive = true): StockState {
  if (!isActive || quantity <= 0) return 'out';
  if (quantity === 1) return 'last_one';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low';
  return 'in_stock';
}

export function stockLabel(quantity: number, isActive = true): string {
  switch (stockState(quantity, isActive)) {
    case 'out':
      return 'Out of stock';
    case 'last_one':
      return 'Last one';
    case 'low':
      return `Only ${quantity} left`;
    case 'in_stock':
      return 'In stock';
  }
}
