/**
 * Database seed.
 *
 * Builds the shop as it would actually look: six categories, sixteen
 * products, roughly ninety variants across condition grades, real stock
 * counts, a trade in price list, and a handful of orders in different states
 * so the staff screens have something to show.
 *
 * Stock counts are deliberately uneven, including several variants down to
 * one or two units, because that is what exercises the low-stock messaging
 * and the overselling guard.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import { requireDatabaseUrl } from '../lib/env';
import { categorySeeds, productSeeds } from '../data/catalogue';
import { categoryImages, productImages } from '../data/images';
import { tradeInModelSeeds } from '../data/tradein-models';
import { generateOrderReference } from '../lib/orders/reference';
import { store } from '../data/store';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
});

/** Deterministic, so reseeding produces the same shop. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

/** "256GB, Black Titanium, Excellent" */
function variantLabel(v: {
  storageGb: number | null;
  colourName: string;
  condition: string;
}): string {
  return [v.storageGb ? `${v.storageGb}GB` : null, v.colourName, v.condition]
    .filter(Boolean)
    .join(', ');
}

/**
 * Stable, readable SKU. Printed on the shelf label.
 *
 * Nothing here is truncated, which is deliberate and was learned the hard way.
 * An earlier version shortened the model to ten characters and the colour to
 * six, which made iphone-16-pro and iphone-16-pro-max the same SKU, and would
 * have done the same to Space Black and Space Blue. A shorter label is not
 * worth a collision, because a collision means two different devices share an
 * identifier on the shelf.
 */
function makeSku(
  productSlug: string,
  v: { storageGb: number | null; colourName: string; condition: string },
): string {
  const model = productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const storage = v.storageGb ? `${v.storageGb}` : 'NA';
  const colour = v.colourName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const grade = v.condition.slice(0, 3).toUpperCase();
  return `${model}-${storage}-${colour}-${grade}`;
}

/**
 * Fail before any write if the catalogue cannot produce unique SKUs.
 *
 * Checked rather than assumed, so a future catalogue edit that reintroduces a
 * clash stops here with a message naming both offenders, instead of failing
 * halfway through the insert with a unique constraint violation.
 */
function assertSkusAreUnique(): void {
  const seen = new Map<string, string>();
  for (const product of productSeeds) {
    for (const variant of product.variants) {
      const sku = makeSku(product.slug, variant);
      const existing = seen.get(sku);
      if (existing) {
        throw new Error(
          `Two variants produce the SKU ${sku}: ${existing} and ${product.slug} (${variant.colourName}, ${variant.condition}). Fix the catalogue or makeSku before seeding.`,
        );
      }
      seen.set(sku, product.slug);
    }
  }
}

async function clearAll() {
  // Ordered so foreign keys are never violated.
  await prisma.stockMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.tradeInQuote.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tradeInModel.deleteMany();
  await prisma.storeSetting.deleteMany();
}

async function main() {
  console.log('Seeding The Apple Bros...');
  assertSkusAreUnique();
  await clearAll();

  /* ---------------------------------------------------------------- */
  /* Settings                                                          */
  /* ---------------------------------------------------------------- */

  await prisma.storeSetting.createMany({
    data: [
      {
        key: 'freeDeliveryThresholdCents',
        value: String(store.freeDeliveryThresholdCents),
      },
      { key: 'standardDeliveryCents', value: String(store.standardDeliveryCents) },
      { key: 'returnWindowDays', value: String(store.returnWindowDays) },
    ],
  });

  /* ---------------------------------------------------------------- */
  /* Categories                                                        */
  /* ---------------------------------------------------------------- */

  const categoryIdBySlug = new Map<string, string>();
  for (const c of categorySeeds) {
    const created = await prisma.category.create({
      data: {
        slug: c.slug,
        family: c.family,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        imageUrl: categoryImages[c.slug] ?? null,
        sortOrder: c.sortOrder,
      },
    });
    categoryIdBySlug.set(c.slug, created.id);
  }
  console.log(`  categories: ${categorySeeds.length}`);

  /* ---------------------------------------------------------------- */
  /* Products, images and variants                                     */
  /* ---------------------------------------------------------------- */

  let variantCount = 0;
  let unitCount = 0;
  const variantIds: { id: string; price: number }[] = [];

  for (const p of productSeeds) {
    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Unknown category: ${p.categorySlug}`);

    const created = await prisma.product.create({
      data: {
        slug: p.slug,
        categoryId,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        highlights: p.highlights.join('\n'),
        specsJson: JSON.stringify(p.specs),
        releaseYear: p.releaseYear,
        isFeatured: p.isFeatured,
        sortOrder: p.sortOrder,
      },
    });

    const images = productImages[p.slug] ?? [];
    for (const [index, image] of images.entries()) {
      await prisma.productImage.create({
        data: {
          productId: created.id,
          url: image.src,
          alt: image.alt,
          sortOrder: index * 10,
        },
      });
    }

    for (const v of p.variants) {
      const variant = await prisma.variant.create({
        data: {
          productId: created.id,
          sku: makeSku(p.slug, v),
          storageGb: v.storageGb,
          colourName: v.colourName,
          colourHex: v.colourHex,
          condition: v.condition,
          priceCents: v.priceCents,
          compareAtCents: v.compareAtCents,
          stockQuantity: v.stockQuantity,
          batteryHealthMin: v.batteryHealthMin,
          warrantyMonths: v.warrantyMonths,
          conditionNote: v.conditionNote ?? null,
        },
      });

      // Opening stock is a real movement, so the ledger balances from the
      // very first row rather than starting from an unexplained number.
      if (v.stockQuantity > 0) {
        await prisma.stockMovement.create({
          data: {
            variantId: variant.id,
            delta: v.stockQuantity,
            resulting: v.stockQuantity,
            reason: 'intake',
            note: 'Opening stock',
          },
        });
      }

      variantIds.push({ id: variant.id, price: v.priceCents });
      variantCount += 1;
      unitCount += v.stockQuantity;
    }
  }
  console.log(
    `  products: ${productSeeds.length}, variants: ${variantCount}, units on hand: ${unitCount}`,
  );

  /* ---------------------------------------------------------------- */
  /* Trade in price list                                               */
  /* ---------------------------------------------------------------- */

  for (const m of tradeInModelSeeds) {
    await prisma.tradeInModel.create({
      data: {
        slug: m.slug,
        family: m.family,
        label: m.label,
        storageOptions: m.storageOptions.join('\n'),
        baseValueCents: m.baseValueCents,
        releaseYear: m.releaseYear,
        sortOrder: m.sortOrder,
      },
    });
  }
  console.log(`  trade in models: ${tradeInModelSeeds.length}`);

  /* ---------------------------------------------------------------- */
  /* A few orders, so the staff screens have something in them         */
  /* ---------------------------------------------------------------- */

  const random = makeRandom(20_261_006);
  const customers = [
    ['Lerato Mokoena', 'lerato.mokoena@example.co.za', '+27821230001'],
    ['Ryan Petersen', 'ryan.petersen@example.co.za', '+27821230002'],
    ['Fatima Davids', 'fatima.davids@example.co.za', '+27821230003'],
    ['Sipho Nkosi', 'sipho.nkosi@example.co.za', '+27821230004'],
    ['Hannah de Villiers', 'hannah.dv@example.co.za', '+27821230005'],
    ['Thabo Molefe', 'thabo.molefe@example.co.za', '+27821230006'],
  ] as const;

  const statuses = [
    'pending_payment',
    'paid',
    'packing',
    'ready_for_collection',
    'shipped',
    'completed',
  ] as const;

  let orderCount = 0;
  for (const [index, [name, email, mobile]] of customers.entries()) {
    const status = statuses[index % statuses.length]!;
    const fulfilment = index % 3 === 0 ? 'collect' : 'delivery';

    // One or two lines, from variants with enough stock to spare.
    const lineCount = random() > 0.6 ? 2 : 1;
    const chosen: { id: string; price: number; quantity: number }[] = [];
    for (let i = 0; i < lineCount; i += 1) {
      const candidate = variantIds[Math.floor(random() * variantIds.length)]!;
      if (chosen.some((c) => c.id === candidate.id)) continue;
      chosen.push({ ...candidate, quantity: 1 });
    }
    if (chosen.length === 0) continue;

    const subtotalCents = chosen.reduce(
      (sum, c) => sum + c.price * c.quantity,
      0,
    );
    const shippingCents =
      fulfilment === 'collect' || subtotalCents >= store.freeDeliveryThresholdCents
        ? 0
        : store.standardDeliveryCents;

    const placedAt = new Date();
    placedAt.setDate(placedAt.getDate() - (customers.length - index));

    const variantRows = await prisma.variant.findMany({
      where: { id: { in: chosen.map((c) => c.id) } },
      include: { product: { select: { name: true, images: { take: 1 } } } },
    });
    const byId = new Map(variantRows.map((v) => [v.id, v]));

    const order = await prisma.order.create({
      data: {
        reference: generateOrderReference(),
        status,
        customerName: name,
        customerEmail: email,
        customerEmailNormalized: email.toLowerCase(),
        customerMobile: mobile,
        fulfilment,
        paymentMethod: fulfilment === 'collect' ? 'card_on_collection' : 'eft',
        ...(fulfilment === 'delivery'
          ? {
              addressLine1: `${10 + index} Oak Avenue`,
              addressSuburb: 'Parkhurst',
              addressCity: 'Johannesburg',
              addressProvince: 'Gauteng',
              addressPostalCode: '2193',
            }
          : {}),
        subtotalCents,
        shippingCents,
        tradeInCents: 0,
        totalCents: subtotalCents + shippingCents,
        placedAt,
        ...(status !== 'pending_payment' ? { paidAt: placedAt } : {}),
        items: {
          create: chosen.map((c) => {
            const v = byId.get(c.id)!;
            return {
              variantId: c.id,
              quantity: c.quantity,
              skuSnapshot: v.sku,
              nameSnapshot: v.product.name,
              variantSnapshot: variantLabel(v),
              conditionSnapshot: v.condition,
              imageSnapshot: v.product.images[0]?.url ?? null,
              unitPriceCents: v.priceCents,
              lineTotalCents: v.priceCents * c.quantity,
              warrantyMonths: v.warrantyMonths,
            };
          }),
        },
      },
    });

    // These orders hold stock, so take it, exactly as a real order would.
    for (const c of chosen) {
      const taken = await prisma.variant.updateMany({
        where: { id: c.id, stockQuantity: { gte: c.quantity } },
        data: { stockQuantity: { decrement: c.quantity } },
      });
      if (taken.count === 0) continue;
      const after = await prisma.variant.findUniqueOrThrow({
        where: { id: c.id },
        select: { stockQuantity: true },
      });
      await prisma.stockMovement.create({
        data: {
          variantId: c.id,
          delta: -c.quantity,
          resulting: after.stockQuantity,
          reason: 'order_placed',
          orderId: order.id,
        },
      });
    }

    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: fulfilment === 'collect' ? 'card_on_collection' : 'eft',
        provider: 'manual',
        amountCents: subtotalCents + shippingCents,
        status: status === 'pending_payment' ? 'pending' : 'paid',
        ...(status !== 'pending_payment' ? { paidAt: placedAt } : {}),
      },
    });

    orderCount += 1;
  }
  console.log(`  orders: ${orderCount}, across several states`);

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
