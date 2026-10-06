import 'server-only';

import { prisma } from '@/lib/db';
import { CONDITION_SHORT, STOCK_HOLDING_ORDER_STATUSES } from '@/lib/domain/enums';
import { LOW_STOCK_THRESHOLD } from '@/lib/orders/stock';
import type { Condition, OrderStatus } from '@/types';

/**
 * Reads for the staff screens.
 *
 * Separate from lib/catalogue/queries.ts because these answer different
 * questions and have different rules: a staff screen wants inactive variants,
 * cancelled orders and everything else the shop front deliberately hides.
 */

export interface AdminMetrics {
  readonly ordersToday: number;
  readonly awaitingPayment: number;
  readonly toPrepare: number;
  readonly revenueThisMonthCents: number;
  readonly lowStockCount: number;
  readonly outOfStockCount: number;
  readonly tradeInsWaiting: number;
}

export async function getAdminMetrics(now = new Date()): Promise<AdminMetrics> {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    ordersToday,
    awaitingPayment,
    toPrepare,
    revenue,
    lowStock,
    outOfStock,
    tradeInsWaiting,
  ] = await Promise.all([
    prisma.order.count({ where: { placedAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { status: 'pending_payment' } }),
    prisma.order.count({ where: { status: { in: ['paid', 'packing'] } } }),
    // Revenue counts orders that have actually been paid. Counting placed
    // orders would flatter the figure with things nobody has paid for.
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: {
        placedAt: { gte: startOfMonth },
        status: { in: ['paid', 'packing', 'ready_for_collection', 'shipped', 'completed'] },
      },
    }),
    prisma.variant.count({
      where: {
        isActive: true,
        stockQuantity: { gt: 0, lte: LOW_STOCK_THRESHOLD },
      },
    }),
    prisma.variant.count({ where: { isActive: true, stockQuantity: 0 } }),
    prisma.tradeInQuote.count({ where: { status: 'quoted' } }),
  ]);

  return {
    ordersToday,
    awaitingPayment,
    toPrepare,
    revenueThisMonthCents: revenue._sum.totalCents ?? 0,
    lowStockCount: lowStock,
    outOfStockCount: outOfStock,
    tradeInsWaiting,
  };
}

export interface AdminOrderRow {
  readonly id: string;
  readonly reference: string;
  readonly status: OrderStatus;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly fulfilment: string;
  readonly totalCents: number;
  readonly itemCount: number;
  readonly placedAt: string;
}

export async function listOrders(options: {
  readonly status?: OrderStatus;
  readonly query?: string;
  readonly take?: number;
} = {}): Promise<AdminOrderRow[]> {
  const query = options.query?.trim();

  const rows = await prisma.order.findMany({
    where: {
      ...(options.status ? { status: options.status } : {}),
      ...(query
        ? {
            OR: [
              { reference: { contains: query.toUpperCase() } },
              { customerName: { contains: query, mode: 'insensitive' as const } },
              {
                customerEmailNormalized: {
                  contains: query.toLowerCase(),
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { placedAt: 'desc' },
    take: options.take ?? 50,
    include: { items: { select: { quantity: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    status: row.status as OrderStatus,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    fulfilment: row.fulfilment,
    totalCents: row.totalCents,
    itemCount: row.items.reduce((sum, item) => sum + item.quantity, 0),
    placedAt: row.placedAt.toISOString(),
  }));
}

export async function getOrderDetail(reference: string) {
  return prisma.order.findUnique({
    where: { reference },
    include: {
      items: true,
      payments: { orderBy: { createdAt: 'desc' } },
      movements: { orderBy: { createdAt: 'desc' } },
      tradeIn: true,
    },
  });
}

export interface AdminStockRow {
  readonly variantId: string;
  readonly sku: string;
  readonly productName: string;
  readonly productSlug: string;
  readonly variantLabel: string;
  readonly condition: Condition;
  readonly priceCents: number;
  readonly stockQuantity: number;
  readonly isActive: boolean;
  /** Units sitting in orders that have not shipped, for the gap check below. */
  readonly committed: number;
}

/**
 * The stock screen.
 *
 * `committed` is the quantity already inside orders that still hold their
 * stock. It is shown next to the shelf quantity because the two together are
 * what tells somebody whether a shelf is genuinely empty or whether the units
 * are boxed and waiting for a courier.
 */
export async function listStock(options: {
  readonly lowOnly?: boolean;
  readonly query?: string;
} = {}): Promise<AdminStockRow[]> {
  const query = options.query?.trim();

  const variants = await prisma.variant.findMany({
    where: {
      ...(options.lowOnly
        ? { stockQuantity: { lte: LOW_STOCK_THRESHOLD } }
        : {}),
      ...(query
        ? {
            OR: [
              { sku: { contains: query.toUpperCase() } },
              {
                product: {
                  name: { contains: query, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: [{ stockQuantity: 'asc' }, { sku: 'asc' }],
    take: 200,
  });

  const committed = await prisma.orderItem.groupBy({
    by: ['variantId'],
    _sum: { quantity: true },
    where: {
      variantId: { in: variants.map((v) => v.id) },
      order: { status: { in: [...STOCK_HOLDING_ORDER_STATUSES] } },
    },
  });
  const committedById = new Map(
    committed.map((c) => [c.variantId, c._sum.quantity ?? 0]),
  );

  return variants.map((variant) => ({
    variantId: variant.id,
    sku: variant.sku,
    productName: variant.product.name,
    productSlug: variant.product.slug,
    variantLabel: [
      variant.storageGb ? `${variant.storageGb}GB` : null,
      variant.colourName,
      CONDITION_SHORT[variant.condition as Condition],
    ]
      .filter(Boolean)
      .join(', '),
    condition: variant.condition as Condition,
    priceCents: variant.priceCents,
    stockQuantity: variant.stockQuantity,
    isActive: variant.isActive,
    committed: committedById.get(variant.id) ?? 0,
  }));
}

/**
 * Trade in quotes, each tagged with whether it has lapsed.
 *
 * The comparison against the clock happens here rather than in the page,
 * because a component that reads Date.now() while rendering is not a pure
 * function of its props and can disagree with itself between renders.
 */
export async function listTradeIns(take = 50, now = new Date()) {
  const rows = await prisma.tradeInQuote.findMany({
    orderBy: { createdAt: 'desc' },
    take,
  });

  return rows.map((row) => ({
    ...row,
    hasLapsed: row.status === 'quoted' && row.expiresAt.getTime() < now.getTime(),
  }));
}
