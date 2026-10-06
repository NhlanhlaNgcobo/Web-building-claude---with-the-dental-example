import 'server-only';

import { prisma } from '@/lib/db';
import { store } from '@/data/store';
import {
  CONDITION_SHORT,
  ORDER_TRANSITIONS,
  type FulfilmentMethod,
  type OrderStatus,
  type PaymentMethod,
  type StockReason,
} from '@/lib/domain/enums';
import { generateOrderReference, normalizeReference } from './reference';
import {
  BasketEmptyError,
  InvalidTransitionError,
  OrderError,
  OrderNotFoundError,
  OutOfStockError,
  TradeInExpiredError,
} from './errors';
import type { Shortfall } from './stock';

/**
 * Order writes.
 *
 * ---------------------------------------------------------------------------
 * How overselling is prevented
 * ---------------------------------------------------------------------------
 *
 * There is exactly one physical device behind each unit of stock, so selling
 * the same one twice means a refund, an apology and a customer who does not
 * come back. Three layers stop it:
 *
 *   1. The catalogue only offers variants with stock, so a shopper rarely
 *      meets the problem at all.
 *
 *   2. This transaction decrements conditionally. The UPDATE carries
 *      `WHERE "stockQuantity" >= :quantity`, so when two orders race for the
 *      last unit, the second one updates zero rows. That is the real
 *      mechanism: the database decides, atomically, and there is no window
 *      between checking and taking.
 *
 *   3. A CHECK constraint in migration 20261006120100 makes a negative
 *      quantity impossible regardless, so no future code path can get it
 *      wrong.
 *
 * Note what this deliberately does NOT do: read the stock level, compare it
 * in JavaScript, then write. That pattern looks correct and is a race. The
 * comparison has to happen inside the write.
 *
 * Prices are re-read inside the transaction too. Whatever the browser sent is
 * a hint with no authority, which is what stops a tampered basket buying a
 * MacBook for one Rand.
 */

export interface OrderLineInput {
  readonly variantId: string;
  readonly quantity: number;
}

export interface CreateOrderInput {
  readonly lines: readonly OrderLineInput[];
  readonly customer: {
    readonly name: string;
    readonly email: string;
    readonly mobile: string;
  };
  readonly fulfilment: FulfilmentMethod;
  readonly paymentMethod: PaymentMethod;
  readonly address?: {
    readonly line1: string;
    readonly line2?: string;
    readonly suburb: string;
    readonly city: string;
    readonly province: string;
    readonly postalCode: string;
  };
  readonly customerNote?: string;
  /** Applied against the total, verified server-side before it counts. */
  readonly tradeInReference?: string;
}

export interface CreatedOrder {
  readonly reference: string;
  readonly status: OrderStatus;
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly tradeInCents: number;
  readonly totalCents: number;
}

/**
 * Delivery cost.
 *
 * Collection is free, and delivery is free above a published threshold. Both
 * live in data/store.ts so the number in the copy and the number charged can
 * never drift apart.
 */
export function shippingCentsFor(
  fulfilment: FulfilmentMethod,
  subtotalCents: number,
): number {
  if (fulfilment === 'collect') return 0;
  return subtotalCents >= store.freeDeliveryThresholdCents
    ? 0
    : store.standardDeliveryCents;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreatedOrder> {
  if (input.lines.length === 0) throw new BasketEmptyError();

  // Collapse duplicate lines for the same variant. Two lines of one is
  // indistinguishable from one line of two to the warehouse, and merging
  // them here means the decrement below runs once per variant.
  const merged = new Map<string, number>();
  for (const line of input.lines) {
    if (line.quantity <= 0) continue;
    merged.set(
      line.variantId,
      (merged.get(line.variantId) ?? 0) + line.quantity,
    );
  }
  if (merged.size === 0) throw new BasketEmptyError();

  return prisma.$transaction(
    async (tx) => {
      /* ---- Re-read everything from the database ---- */
      const variants = await tx.variant.findMany({
        where: { id: { in: [...merged.keys()] } },
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
      });

      const byId = new Map(variants.map((v) => [v.id, v]));

      /* ---- Fail fast on anything that cannot be sold ---- */
      const shortfalls: Shortfall[] = [];
      for (const [variantId, quantity] of merged) {
        const variant = byId.get(variantId);
        if (!variant || !variant.isActive) {
          shortfalls.push({
            variantId,
            requested: quantity,
            available: 0,
            reason: 'unavailable',
          });
        } else if (variant.stockQuantity < quantity) {
          shortfalls.push({
            variantId,
            requested: quantity,
            available: Math.max(variant.stockQuantity, 0),
            reason: variant.stockQuantity <= 0 ? 'unavailable' : 'insufficient',
          });
        }
      }
      if (shortfalls.length > 0) throw new OutOfStockError(shortfalls);

      /* ---- Trade in, verified rather than trusted ---- */
      let tradeInCents = 0;
      let tradeInId: string | null = null;
      if (input.tradeInReference) {
        const quote = await tx.tradeInQuote.findUnique({
          where: { reference: normalizeReference(input.tradeInReference) },
        });
        if (!quote || quote.orderId !== null) {
          throw new OrderError(
            'TRADE_IN_INVALID',
            'That trade in reference is not valid, or has already been used.',
            { status: 409 },
          );
        }
        if (quote.expiresAt < new Date()) throw new TradeInExpiredError();
        // The value comes from the stored quote, never from the request.
        tradeInCents = quote.revisedCents ?? quote.quotedCents;
        tradeInId = quote.id;
      }

      /* ---- Totals, computed here from database prices ---- */
      const items = [...merged.entries()].map(([variantId, quantity]) => {
        const variant = byId.get(variantId)!;
        const unitPriceCents = variant.priceCents;
        return {
          variantId,
          quantity,
          skuSnapshot: variant.sku,
          nameSnapshot: variant.product.name,
          variantSnapshot: describeVariant(variant),
          conditionSnapshot: variant.condition,
          imageSnapshot: variant.product.images[0]?.url ?? null,
          unitPriceCents,
          lineTotalCents: unitPriceCents * quantity,
          warrantyMonths: variant.warrantyMonths,
        };
      });

      const subtotalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);
      const shippingCents = shippingCentsFor(input.fulfilment, subtotalCents);
      // A trade in worth more than the basket does not produce a negative
      // total; the balance is paid out separately rather than silently lost.
      const appliedTradeIn = Math.min(tradeInCents, subtotalCents + shippingCents);
      const totalCents = subtotalCents + shippingCents - appliedTradeIn;

      /* ---- Create the order ---- */
      let order: Awaited<ReturnType<typeof tx.order.create>> | null = null;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          order = await tx.order.create({
            data: {
              reference: generateOrderReference(),
              status:
                input.paymentMethod === 'card_on_collection'
                  ? 'pending_payment'
                  : 'pending_payment',
              customerName: input.customer.name,
              customerEmail: input.customer.email,
              customerEmailNormalized: input.customer.email.trim().toLowerCase(),
              customerMobile: input.customer.mobile,
              fulfilment: input.fulfilment,
              paymentMethod: input.paymentMethod,
              addressLine1: input.address?.line1 ?? null,
              addressLine2: input.address?.line2 ?? null,
              addressSuburb: input.address?.suburb ?? null,
              addressCity: input.address?.city ?? null,
              addressProvince: input.address?.province ?? null,
              addressPostalCode: input.address?.postalCode ?? null,
              subtotalCents,
              shippingCents,
              tradeInCents: appliedTradeIn,
              totalCents,
              customerNote: input.customerNote ?? null,
              items: { create: items },
            },
          });
          break;
        } catch (error) {
          if (!isUniqueConstraintError(error)) throw error;
        }
      }
      if (!order) {
        throw new OrderError(
          'REFERENCE_GENERATION_FAILED',
          'We could not complete your order. Please try again.',
          { status: 500 },
        );
      }

      /* ---- The decisive step: take the stock ----
         Conditional, so a concurrent order for the last unit updates no rows
         and this whole transaction rolls back. */
      for (const item of items) {
        const taken = await tx.variant.updateMany({
          where: {
            id: item.variantId,
            isActive: true,
            stockQuantity: { gte: item.quantity },
          },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        if (taken.count === 0) {
          // Somebody took it between the check above and this write. Re-read
          // to report the true remaining figure rather than a stale one.
          const current = await tx.variant.findUnique({
            where: { id: item.variantId },
            select: { stockQuantity: true, isActive: true },
          });
          throw new OutOfStockError([
            {
              variantId: item.variantId,
              requested: item.quantity,
              available: Math.max(current?.stockQuantity ?? 0, 0),
              reason:
                !current?.isActive || (current?.stockQuantity ?? 0) <= 0
                  ? 'unavailable'
                  : 'insufficient',
            },
          ]);
        }

        const after = await tx.variant.findUniqueOrThrow({
          where: { id: item.variantId },
          select: { stockQuantity: true },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            delta: -item.quantity,
            resulting: after.stockQuantity,
            reason: 'order_placed' satisfies StockReason,
            orderId: order.id,
          },
        });
      }

      if (tradeInId) {
        await tx.tradeInQuote.update({
          where: { id: tradeInId },
          data: { orderId: order.id, status: 'accepted' },
        });
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          method: input.paymentMethod,
          provider: 'manual',
          amountCents: totalCents,
          status: 'pending',
        },
      });

      return {
        reference: order.reference,
        status: order.status as OrderStatus,
        subtotalCents,
        shippingCents,
        tradeInCents: appliedTradeIn,
        totalCents,
      };
    },
    { timeout: 15_000 },
  );
}

/* ------------------------------------------------------------------ */
/* Status changes                                                      */
/* ------------------------------------------------------------------ */

/**
 * Move an order through the workflow.
 *
 * Cancelling or refunding returns the stock, which is the half of the
 * lifecycle that is easy to forget and leaves a shop with devices it thinks
 * it has sold.
 */
export async function setOrderStatus(args: {
  orderId: string;
  status: OrderStatus;
  reason?: string;
  internalNote?: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: args.orderId },
      include: { items: true },
    });
    if (!order) throw new OrderNotFoundError();

    const current = order.status as OrderStatus;

    // Setting a status to the one it already has does nothing, rather than
    // failing. A staff member who double-clicks cancel should not be shown an
    // error, and more importantly the early return is what stops the stock
    // being returned to the shelf a second time.
    if (current === args.status) return;

    if (!ORDER_TRANSITIONS[current].includes(args.status)) {
      throw new InvalidTransitionError(current, args.status);
    }

    const releasing = args.status === 'cancelled' || args.status === 'refunded';

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: args.status,
        ...(args.status === 'paid' ? { paidAt: new Date() } : {}),
        ...(releasing
          ? { cancelledAt: new Date(), cancelReason: args.reason ?? null }
          : {}),
        ...(args.internalNote ? { internalNote: args.internalNote } : {}),
      },
    });

    if (releasing) {
      for (const item of order.items) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
        const after = await tx.variant.findUniqueOrThrow({
          where: { id: item.variantId },
          select: { stockQuantity: true },
        });
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            delta: item.quantity,
            resulting: after.stockQuantity,
            reason: (args.status === 'cancelled'
              ? 'order_cancelled'
              : 'order_refunded') satisfies StockReason,
            orderId: order.id,
          },
        });
      }
    }
  });
}

/* ------------------------------------------------------------------ */
/* Stock adjustment                                                    */
/* ------------------------------------------------------------------ */

/**
 * Change stock by hand: intake, a write-off, a correction.
 *
 * Always through this function rather than by editing the quantity, so every
 * movement lands in the ledger and the number on a variant stays explainable.
 */
export async function adjustStock(args: {
  variantId: string;
  delta: number;
  reason: StockReason;
  note?: string;
}): Promise<number> {
  if (args.delta === 0) {
    throw new OrderError('VARIANT_UNAVAILABLE', 'No change requested.', {
      status: 400,
    });
  }

  return prisma.$transaction(async (tx) => {
    // Guard the decrement the same way the order path does, so a correction
    // cannot drive stock negative either.
    const updated = await tx.variant.updateMany({
      where:
        args.delta < 0
          ? { id: args.variantId, stockQuantity: { gte: -args.delta } }
          : { id: args.variantId },
      data: { stockQuantity: { increment: args.delta } },
    });

    if (updated.count === 0) {
      throw new OrderError(
        'OUT_OF_STOCK',
        'That would take the stock below zero. Check the figure and try again.',
        { status: 409 },
      );
    }

    const after = await tx.variant.findUniqueOrThrow({
      where: { id: args.variantId },
      select: { stockQuantity: true },
    });

    await tx.stockMovement.create({
      data: {
        variantId: args.variantId,
        delta: args.delta,
        resulting: after.stockQuantity,
        reason: args.reason,
        note: args.note ?? null,
      },
    });

    return after.stockQuantity;
  });
}

/* ------------------------------------------------------------------ */
/* Lookup                                                              */
/* ------------------------------------------------------------------ */

/**
 * Find an order by reference plus the email it was placed with.
 *
 * Returns the same error for a missing reference and a mismatched email, so
 * this cannot be used to work out which references exist.
 */
export async function lookupOrder(reference: string, email: string) {
  const order = await prisma.order.findUnique({
    where: { reference: normalizeReference(reference) },
    include: { items: true },
  });
  if (!order) throw new OrderNotFoundError();

  if (
    !constantTimeEquals(
      order.customerEmailNormalized,
      email.trim().toLowerCase(),
    )
  ) {
    throw new OrderNotFoundError();
  }

  return order;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** "256GB, Black Titanium, Excellent" */
function describeVariant(variant: {
  storageGb: number | null;
  colourName: string;
  condition: string;
}): string {
  const parts = [
    variant.storageGb ? `${variant.storageGb}GB` : null,
    variant.colourName,
    CONDITION_SHORT[variant.condition as keyof typeof CONDITION_SHORT] ??
      variant.condition,
  ];
  return parts.filter(Boolean).join(', ');
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
