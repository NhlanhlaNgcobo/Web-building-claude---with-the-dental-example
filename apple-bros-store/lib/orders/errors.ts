import type { Shortfall } from './stock';

/**
 * Typed order errors.
 *
 * Each one carries what the interface needs to recover. A stock failure is
 * the important case: it arrives with the exact shortfall per line, so
 * checkout can say "we have two of these, not five" and offer a one-click
 * fix, rather than a generic failure that leaves the customer guessing which
 * item is the problem.
 */

export type OrderErrorCode =
  | 'OUT_OF_STOCK'
  | 'BASKET_EMPTY'
  | 'VARIANT_UNAVAILABLE'
  | 'PRICE_CHANGED'
  | 'NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'TRADE_IN_INVALID'
  | 'TRADE_IN_MODEL_NOT_FOUND'
  | 'TRADE_IN_STORAGE_NOT_VALID'
  | 'TRADE_IN_EXPIRED'
  | 'REFERENCE_GENERATION_FAILED';

export class OrderError extends Error {
  readonly code: OrderErrorCode;
  readonly status: number;
  readonly shortfalls: readonly Shortfall[];

  constructor(
    code: OrderErrorCode,
    message: string,
    options: { status?: number; shortfalls?: readonly Shortfall[] } = {},
  ) {
    super(message);
    this.name = 'OrderError';
    this.code = code;
    this.status = options.status ?? 400;
    this.shortfalls = options.shortfalls ?? [];
  }
}

/**
 * Somebody else bought it between the basket being shown and the order being
 * placed.
 *
 * Carries every affected line rather than the first, because fixing a basket
 * one rejection at a time is maddening.
 */
export class OutOfStockError extends OrderError {
  constructor(shortfalls: readonly Shortfall[]) {
    const count = shortfalls.length;
    super(
      'OUT_OF_STOCK',
      count === 1
        ? 'One item in your basket has just sold out or does not have enough left.'
        : `${count} items in your basket have just sold out or do not have enough left.`,
      { status: 409, shortfalls },
    );
    this.name = 'OutOfStockError';
  }
}

export class BasketEmptyError extends OrderError {
  constructor() {
    super('BASKET_EMPTY', 'Your basket is empty.', { status: 400 });
    this.name = 'BasketEmptyError';
  }
}

/**
 * The price moved between the basket being built and checkout.
 *
 * Refusing rather than silently charging the new price is the honest
 * behaviour, and in South Africa the Consumer Protection Act is explicit that
 * a displayed price is the price. The customer is shown both figures and asked
 * to confirm.
 */
export class PriceChangedError extends OrderError {
  readonly changes: readonly {
    readonly variantId: string;
    readonly wasCents: number;
    readonly nowCents: number;
  }[];

  constructor(
    changes: readonly {
      variantId: string;
      wasCents: number;
      nowCents: number;
    }[],
  ) {
    super(
      'PRICE_CHANGED',
      'A price in your basket has changed since you added it. Please check the new total before continuing.',
      { status: 409 },
    );
    this.name = 'PriceChangedError';
    this.changes = changes;
  }
}

export class OrderNotFoundError extends OrderError {
  constructor() {
    // Identical whether the reference does not exist or the email does not
    // match, so this cannot be used to discover which references are real.
    super('NOT_FOUND', 'No order found with those details.', { status: 404 });
    this.name = 'OrderNotFoundError';
  }
}

export class InvalidTransitionError extends OrderError {
  constructor(from: string, to: string) {
    super(
      'INVALID_TRANSITION',
      `An order that is ${from} cannot be moved to ${to}.`,
      { status: 409 },
    );
    this.name = 'InvalidTransitionError';
  }
}

export class TradeInExpiredError extends OrderError {
  constructor() {
    super(
      'TRADE_IN_EXPIRED',
      'That trade in quote has expired. Device values move, so please get a fresh quote.',
      { status: 409 },
    );
    this.name = 'TradeInExpiredError';
  }
}

export function isOrderError(error: unknown): error is OrderError {
  return error instanceof OrderError;
}
