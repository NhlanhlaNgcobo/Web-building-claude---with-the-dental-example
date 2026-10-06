import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';

/**
 * Database-backed order tests.
 *
 * These are the ones that matter. The pure tests prove the arithmetic; these
 * prove the thing the arithmetic cannot: that two people clicking buy on the
 * last unit at the same moment produce exactly one sale.
 *
 * They need a real PostgreSQL database, because the guarantee they are testing
 * comes from PostgreSQL. A conditional UPDATE and a CHECK constraint are not
 * things an in-memory fake can be made to honour, and a fake that pretended to
 * would turn this file from a proof into a decoration.
 *
 *   DATABASE_URL=postgresql://... npm run test:db
 *
 * Run `npm run db:deploy` against that database first. The suite truncates
 * every table it touches between tests, so point it at a scratch database
 * rather than anything you care about.
 */

const DATABASE_URL = process.env.DATABASE_URL;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL ?? '' }),
});

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

async function truncate() {
  // One statement, so the foreign keys never have to be satisfied mid-way.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "StockMovement", "Payment", "OrderItem", "TradeInQuote",
                   "Order", "Variant", "ProductImage", "Product", "Category"
    RESTART IDENTITY CASCADE
  `);
}

async function makeVariant(stockQuantity: number, priceCents = 1_000_00) {
  const category = await prisma.category.create({
    data: {
      slug: `cat-${Math.random().toString(36).slice(2, 8)}`,
      family: 'iphone',
      name: 'Test category',
      tagline: 'For tests',
      description: 'For tests',
      sortOrder: 1,
    },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      slug: `prod-${Math.random().toString(36).slice(2, 8)}`,
      name: 'Test device',
      tagline: 'For tests',
      description: 'For tests',
      highlights: 'One\nTwo',
      releaseYear: 2024,
    },
  });

  return prisma.variant.create({
    data: {
      productId: product.id,
      sku: `SKU-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      storageGb: 256,
      colourName: 'Black',
      colourHex: '#000000',
      condition: 'excellent',
      priceCents,
      stockQuantity,
      warrantyMonths: 12,
    },
  });
}

function orderInput(variantId: string, quantity = 1) {
  return {
    lines: [{ variantId, quantity }],
    customer: {
      name: 'Test Customer',
      email: 'test@example.com',
      mobile: '0821234567',
    },
    fulfilment: 'collect' as const,
    paymentMethod: 'eft' as const,
  };
}

/* ------------------------------------------------------------------ */

const describeDb = DATABASE_URL ? describe : describe.skip;

describeDb('orders against a real database', () => {
  let createOrder: typeof import('../lib/orders/service').createOrder;
  let setOrderStatus: typeof import('../lib/orders/service').setOrderStatus;
  let adjustStock: typeof import('../lib/orders/service').adjustStock;
  let lookupOrder: typeof import('../lib/orders/service').lookupOrder;

  beforeAll(async () => {
    const service = await import('../lib/orders/service');
    createOrder = service.createOrder;
    setOrderStatus = service.setOrderStatus;
    adjustStock = service.adjustStock;
    lookupOrder = service.lookupOrder;
  });

  beforeEach(truncate);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  /* ---------------- The headline guarantee ---------------- */

  it('sells the last unit exactly once when two orders race for it', async () => {
    const variant = await makeVariant(1);

    // Both start before either finishes. This is the shape of the bug: with a
    // read-then-write the two reads both see 1, both think they can sell, and
    // the shop owes somebody a device it does not have.
    const results = await Promise.allSettled([
      createOrder(orderInput(variant.id)),
      createOrder(orderInput(variant.id)),
    ]);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const after = await prisma.variant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    expect(after.stockQuantity).toBe(0);

    const orders = await prisma.order.count();
    expect(orders).toBe(1);
  });

  it('tells the loser how many are actually left', async () => {
    const variant = await makeVariant(2);

    await createOrder(orderInput(variant.id, 2));

    await expect(createOrder(orderInput(variant.id, 1))).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
      shortfalls: [
        expect.objectContaining({
          variantId: variant.id,
          requested: 1,
          available: 0,
        }),
      ],
    });
  });

  it('refuses a quantity larger than the shelf holds', async () => {
    const variant = await makeVariant(3);

    await expect(createOrder(orderInput(variant.id, 4))).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
    });

    const after = await prisma.variant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    // The failed attempt must not have taken any of it.
    expect(after.stockQuantity).toBe(3);
  });

  it('never lets stock go negative, even if the guard were bypassed', async () => {
    const variant = await makeVariant(1);

    // Writing straight past the service, as a buggy future caller might.
    // The CHECK constraint is the last line and has to hold on its own.
    await expect(
      prisma.variant.update({
        where: { id: variant.id },
        data: { stockQuantity: { decrement: 5 } },
      }),
    ).rejects.toThrow();
  });

  /* ---------------- Prices come from the database ---------------- */

  it('prices the order from the database, not from the request', async () => {
    const variant = await makeVariant(5, 2_500_00);

    const order = await createOrder(orderInput(variant.id, 2));

    expect(order.subtotalCents).toBe(5_000_00);
    // Collection is free, so the total is the subtotal.
    expect(order.totalCents).toBe(5_000_00);
  });

  it('merges two lines for the same variant into one decrement', async () => {
    const variant = await makeVariant(4);

    const order = await createOrder({
      ...orderInput(variant.id),
      lines: [
        { variantId: variant.id, quantity: 1 },
        { variantId: variant.id, quantity: 2 },
      ],
    });

    const after = await prisma.variant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    expect(after.stockQuantity).toBe(1);

    const items = await prisma.orderItem.count({
      where: { order: { reference: order.reference } },
    });
    expect(items).toBe(1);
  });

  /* ---------------- Cancelling returns the stock ---------------- */

  it('returns stock to the shelf when an order is cancelled', async () => {
    const variant = await makeVariant(1);
    const order = await createOrder(orderInput(variant.id));

    const row = await prisma.order.findUniqueOrThrow({
      where: { reference: order.reference },
    });

    await setOrderStatus({
      orderId: row.id,
      status: 'cancelled',
      reason: 'Customer changed their mind',
    });

    const after = await prisma.variant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    expect(after.stockQuantity).toBe(1);

    // And the return is explainable from the ledger rather than being a
    // number that silently changed.
    const movements = await prisma.stockMovement.findMany({
      where: { variantId: variant.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(movements.map((m) => m.delta)).toEqual([-1, 1]);
    expect(movements.at(-1)?.reason).toBe('order_cancelled');
    expect(movements.at(-1)?.resulting).toBe(1);
  });

  it('refuses a transition the state machine does not allow', async () => {
    const variant = await makeVariant(1);
    const order = await createOrder(orderInput(variant.id));
    const row = await prisma.order.findUniqueOrThrow({
      where: { reference: order.reference },
    });

    // pending_payment cannot jump straight to completed.
    await expect(
      setOrderStatus({ orderId: row.id, status: 'completed' }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('does not return stock twice if an order is cancelled twice', async () => {
    const variant = await makeVariant(1);
    const order = await createOrder(orderInput(variant.id));
    const row = await prisma.order.findUniqueOrThrow({
      where: { reference: order.reference },
    });

    // The second call is a no-op rather than an error. Somebody double
    // clicking cancel should not be shown a failure, but the stock must come
    // back exactly once, and the ledger must say so exactly once.
    await setOrderStatus({ orderId: row.id, status: 'cancelled' });
    await setOrderStatus({ orderId: row.id, status: 'cancelled' });

    const after = await prisma.variant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    expect(after.stockQuantity).toBe(1);

    const returns = await prisma.stockMovement.count({
      where: { variantId: variant.id, reason: 'order_cancelled' },
    });
    expect(returns).toBe(1);
  });

  /* ---------------- Manual stock adjustment ---------------- */

  it('records every manual adjustment in the ledger', async () => {
    const variant = await makeVariant(2);

    const resulting = await adjustStock({
      variantId: variant.id,
      delta: 3,
      reason: 'intake',
      note: 'Three arrived from the Tuesday buy',
    });

    expect(resulting).toBe(5);

    const movement = await prisma.stockMovement.findFirstOrThrow({
      where: { variantId: variant.id },
    });
    expect(movement.delta).toBe(3);
    expect(movement.resulting).toBe(5);
    expect(movement.reason).toBe('intake');
  });

  it('refuses an adjustment that would take stock below zero', async () => {
    const variant = await makeVariant(2);

    await expect(
      adjustStock({ variantId: variant.id, delta: -5, reason: 'damaged' }),
    ).rejects.toThrow();

    const after = await prisma.variant.findUniqueOrThrow({
      where: { id: variant.id },
    });
    expect(after.stockQuantity).toBe(2);
  });

  /* ---------------- Lookup ---------------- */

  it('finds an order by reference and the email it was placed with', async () => {
    const variant = await makeVariant(1);
    const order = await createOrder(orderInput(variant.id));

    const found = await lookupOrder(order.reference, 'TEST@Example.com ');
    expect(found.reference).toBe(order.reference);
  });

  it('gives the same answer for a wrong email as for a wrong reference', async () => {
    const variant = await makeVariant(1);
    const order = await createOrder(orderInput(variant.id));

    const wrongEmail = await lookupOrder(
      order.reference,
      'someone-else@example.com',
    ).catch((error: unknown) => error);
    const wrongReference = await lookupOrder(
      'AB-ZZZZZZ',
      'test@example.com',
    ).catch((error: unknown) => error);

    // Identical code and identical message, so this cannot be used to work out
    // which references exist.
    expect((wrongEmail as { code: string }).code).toBe(
      (wrongReference as { code: string }).code,
    );
    expect((wrongEmail as { message: string }).message).toBe(
      (wrongReference as { message: string }).message,
    );
  });

  /* ---------------- References ---------------- */

  it('gives every order a distinct reference', async () => {
    const variant = await makeVariant(20);

    const orders = await Promise.all(
      Array.from({ length: 10 }, () => createOrder(orderInput(variant.id))),
    );

    const references = new Set(orders.map((o) => o.reference));
    expect(references.size).toBe(10);
  });
});
