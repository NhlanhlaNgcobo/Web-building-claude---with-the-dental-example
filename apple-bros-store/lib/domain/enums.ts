/**
 * Single source of truth for every status and grade in the store.
 *
 * Each union is declared once as a const tuple and derives three things from
 * it: the runtime array, the TypeScript union, and the Zod schema used at
 * every trust boundary. Statuses are stored as String columns rather than
 * native enums, so adding one is a code change rather than a migration.
 */
import { z } from 'zod';

function stringUnion<const T extends readonly [string, ...string[]]>(values: T) {
  return { values, schema: z.enum(values) } as const;
}

/* ------------------------------------------------------------------ */
/* Condition grades                                                    */
/* ------------------------------------------------------------------ */

/**
 * Device condition.
 *
 * The order matters: it is used to sort variants best-first on a product
 * page, and to pick the cheapest available grade for the "from" price.
 *
 * These grades are a promise to the customer, so each one has a published
 * definition in data/conditions.ts and a guaranteed minimum battery health.
 * Vague grading is how refurbished electronics gets a bad name.
 */
export const Condition = stringUnion([
  'new',
  'pristine',
  'excellent',
  'good',
  'fair',
]);
export type Condition = (typeof Condition.values)[number];

/** Best to worst, which is also the display order on a product page. */
export const CONDITION_ORDER: readonly Condition[] = [
  'new',
  'pristine',
  'excellent',
  'good',
  'fair',
];

export const CONDITION_LABELS: Record<Condition, string> = {
  new: 'Brand new, sealed',
  pristine: 'Pristine',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
};

/** Short form, for a variant chip where space is tight. */
export const CONDITION_SHORT: Record<Condition, string> = {
  new: 'New',
  pristine: 'Pristine',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
};

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export const OrderStatus = stringUnion([
  'pending_payment',
  'paid',
  'packing',
  'ready_for_collection',
  'shipped',
  'completed',
  'cancelled',
  'refunded',
]);
export type OrderStatus = (typeof OrderStatus.values)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  packing: 'Being prepared',
  ready_for_collection: 'Ready for collection',
  shipped: 'On its way',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/**
 * Statuses that still hold their stock.
 *
 * Stock is decremented when an order is placed, not when it is paid, because
 * the alternative is selling the same device twice while someone is doing an
 * electronic transfer. Cancelling or refunding returns it.
 */
export const STOCK_HOLDING_ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'packing',
  'ready_for_collection',
  'shipped',
  'completed',
] as const satisfies readonly OrderStatus[];

/** Legal status transitions, enforced in the service layer. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['packing', 'refunded', 'cancelled'],
  packing: ['ready_for_collection', 'shipped', 'refunded'],
  ready_for_collection: ['completed', 'refunded'],
  shipped: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};

export const FulfilmentMethod = stringUnion(['collect', 'delivery']);
export type FulfilmentMethod = (typeof FulfilmentMethod.values)[number];

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export const PaymentMethod = stringUnion([
  'eft',
  'card_on_collection',
  'gateway',
]);
export type PaymentMethod = (typeof PaymentMethod.values)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  eft: 'Bank transfer (EFT)',
  card_on_collection: 'Card or cash when you collect',
  gateway: 'Pay online by card',
};

export const FULFILMENT_LABELS: Record<FulfilmentMethod, string> = {
  collect: 'Collect from the shop',
  delivery: 'Courier to my address',
};

export const PaymentStatus = stringUnion([
  'pending',
  'paid',
  'failed',
  'cancelled',
  'refunded',
]);
export type PaymentStatus = (typeof PaymentStatus.values)[number];

/* ------------------------------------------------------------------ */
/* Stock movements                                                     */
/* ------------------------------------------------------------------ */

/**
 * Why stock changed. Every movement is recorded, so the quantity on a variant
 * is always explainable from its history rather than being a number somebody
 * edited.
 */
export const StockReason = stringUnion([
  'order_placed',
  'order_cancelled',
  'order_refunded',
  'intake',
  'correction',
  'damaged',
  'returned',
]);
export type StockReason = (typeof StockReason.values)[number];

export const STOCK_REASON_LABELS: Record<StockReason, string> = {
  order_placed: 'Sold',
  order_cancelled: 'Order cancelled',
  order_refunded: 'Order refunded',
  intake: 'Stock intake',
  correction: 'Manual correction',
  damaged: 'Written off',
  returned: 'Customer return',
};

/* ------------------------------------------------------------------ */
/* Trade in                                                            */
/* ------------------------------------------------------------------ */

export const TradeInStatus = stringUnion([
  'quoted',
  'accepted',
  'received',
  'revised',
  'completed',
  'declined',
  'expired',
]);
export type TradeInStatus = (typeof TradeInStatus.values)[number];

export const TRADE_IN_STATUS_LABELS: Record<TradeInStatus, string> = {
  quoted: 'Quote given',
  accepted: 'Customer accepted',
  received: 'Device received',
  revised: 'Quote revised after inspection',
  completed: 'Paid out',
  declined: 'Declined',
  expired: 'Quote expired',
};

/**
 * The condition a customer reports about their own device.
 *
 * Deliberately fewer and blunter than our selling grades. A customer cannot
 * reliably tell pristine from excellent, and asking them to pretend produces
 * a quote that has to be revised on arrival, which is the worst outcome for
 * everyone.
 */
export const TradeInCondition = stringUnion([
  'flawless',
  'light_marks',
  'visible_wear',
  'damaged',
]);
export type TradeInCondition = (typeof TradeInCondition.values)[number];

export const TRADE_IN_CONDITION_LABELS: Record<TradeInCondition, string> = {
  flawless: 'Like new, no marks',
  light_marks: 'Light scratches, no cracks',
  visible_wear: 'Obvious wear, no cracks',
  damaged: 'Cracked screen or body damage',
};

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export const ProductFamily = stringUnion([
  'iphone',
  'ipad',
  'mac',
  'watch',
  'audio',
  'accessories',
]);
export type ProductFamily = (typeof ProductFamily.values)[number];
