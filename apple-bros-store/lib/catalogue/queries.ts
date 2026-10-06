import 'server-only';

import { prisma } from '@/lib/db';
import type { Condition, ProductFamily } from '@/lib/domain/enums';
import { CONDITION_ORDER } from '@/lib/domain/enums';
import type {
  CategoryDto,
  ProductCardDto,
  ProductDetailDto,
  VariantDto,
} from '@/types';
import { bestSaving, fromPriceCents, type PricedVariant } from './pricing';

/**
 * Catalogue reads.
 *
 * Everything here returns a view model shaped for what the page actually
 * renders, rather than handing a Prisma row to a component. That keeps the
 * database shape out of the UI, and it is what lets a card know whether a
 * product is buyable without the component doing the arithmetic itself.
 */

type VariantRow = {
  id: string;
  sku: string;
  storageGb: number | null;
  colourName: string;
  colourHex: string;
  condition: string;
  priceCents: number;
  compareAtCents: number | null;
  stockQuantity: number;
  batteryHealthMin: number | null;
  warrantyMonths: number;
  conditionNote: string | null;
  isActive: boolean;
};

function toVariantDto(v: VariantRow): VariantDto {
  return {
    id: v.id,
    sku: v.sku,
    storageGb: v.storageGb,
    colourName: v.colourName,
    colourHex: v.colourHex,
    condition: v.condition as Condition,
    priceCents: v.priceCents,
    compareAtCents: v.compareAtCents,
    stockQuantity: v.stockQuantity,
    batteryHealthMin: v.batteryHealthMin,
    warrantyMonths: v.warrantyMonths,
    conditionNote: v.conditionNote,
    isActive: v.isActive,
  };
}

function toPriced(v: VariantRow): PricedVariant {
  return {
    id: v.id,
    condition: v.condition as Condition,
    storageGb: v.storageGb,
    colourName: v.colourName,
    priceCents: v.priceCents,
    compareAtCents: v.compareAtCents,
    stockQuantity: v.stockQuantity,
    isActive: v.isActive,
  };
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  releaseYear: number;
  category: { slug: string; name: string };
  images: { url: string; alt: string; colourName: string | null }[];
  variants: VariantRow[];
}

function toCard(p: ProductRow): ProductCardDto {
  const priced = p.variants.map(toPriced);
  const from = fromPriceCents(priced);
  const saving = bestSaving(priced);

  // The best grade that is genuinely in stock, for the card badge. Showing
  // "New available" when the only new variant sold out would be a lie.
  const buyable = priced.filter((v) => v.isActive && v.stockQuantity > 0);
  const bestCondition =
    buyable.length > 0
      ? buyable
          .map((v) => v.condition)
          .sort(
            (a, b) => CONDITION_ORDER.indexOf(a) - CONDITION_ORDER.indexOf(b),
          )[0]!
      : null;

  // Colour swatches, only for colours that can actually be bought.
  const colourHexes = [
    ...new Map(
      p.variants
        .filter((v) => v.isActive && v.stockQuantity > 0)
        .map((v) => [v.colourName, v.colourHex]),
    ).values(),
  ];

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    imageUrl: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.alt ?? p.name,
    releaseYear: p.releaseYear,
    fromPriceCents: from,
    compareAtCents:
      buyable.find((v) => v.priceCents === from)?.compareAtCents ?? null,
    savingPercent: saving?.percent ?? null,
    bestCondition,
    totalStock: buyable.reduce((sum, v) => sum + v.stockQuantity, 0),
    colourHexes,
  };
}

const productInclude = {
  category: { select: { slug: true, name: true } },
  images: { orderBy: { sortOrder: 'asc' } },
  variants: { where: { isActive: true }, orderBy: { priceCents: 'asc' } },
} as const;

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function getCategories(): Promise<CategoryDto[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    family: c.family as ProductFamily,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    imageUrl: c.imageUrl,
    productCount: c._count.products,
  }));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryDto | null> {
  const c = await prisma.category.findFirst({
    where: { slug, isActive: true },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  if (!c) return null;
  return {
    id: c.id,
    slug: c.slug,
    family: c.family as ProductFamily,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    imageUrl: c.imageUrl,
    productCount: c._count.products,
  };
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export type ProductSort = 'featured' | 'price_asc' | 'price_desc' | 'newest';

export interface ProductFilters {
  readonly categorySlug?: string;
  readonly conditions?: readonly Condition[];
  readonly maxPriceCents?: number;
  readonly minPriceCents?: number;
  readonly inStockOnly?: boolean;
  readonly sort?: ProductSort;
}

/**
 * Products for a grid.
 *
 * Filtering by condition and price happens after the view model is built
 * rather than in SQL, because both questions are about the variants a product
 * has rather than the product itself, and the catalogue is small enough that
 * the clarity is worth more than the query. Revisit if this ever holds tens
 * of thousands of products.
 */
export async function getProducts(
  filters: ProductFilters = {},
): Promise<ProductCardDto[]> {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(filters.categorySlug
        ? { category: { slug: filters.categorySlug } }
        : {}),
    },
    include: productInclude,
    orderBy: [{ sortOrder: 'asc' }, { releaseYear: 'desc' }],
  });

  let cards = rows.map(toCard);

  if (filters.conditions && filters.conditions.length > 0) {
    const wanted = new Set(filters.conditions);
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    cards = cards.filter((card) => {
      const product = bySlug.get(card.slug);
      return product?.variants.some(
        (v) =>
          v.isActive &&
          v.stockQuantity > 0 &&
          wanted.has(v.condition as Condition),
      );
    });
  }

  if (filters.inStockOnly !== false) {
    // Out of stock products still appear by default, because somebody
    // searching for an iPhone 13 should learn that we stock it and it has
    // gone, rather than concluding we never had one.
  }

  if (filters.minPriceCents !== undefined) {
    cards = cards.filter(
      (c) => c.fromPriceCents !== null && c.fromPriceCents >= filters.minPriceCents!,
    );
  }
  if (filters.maxPriceCents !== undefined) {
    cards = cards.filter(
      (c) => c.fromPriceCents !== null && c.fromPriceCents <= filters.maxPriceCents!,
    );
  }

  // In-stock products always sort above sold-out ones, whatever the chosen
  // order, because a grid led by things nobody can buy is a bad grid.
  const inStockFirst = (a: ProductCardDto, b: ProductCardDto) =>
    Number(b.fromPriceCents !== null) - Number(a.fromPriceCents !== null);

  switch (filters.sort) {
    case 'price_asc':
      cards.sort(
        (a, b) =>
          inStockFirst(a, b) ||
          (a.fromPriceCents ?? Infinity) - (b.fromPriceCents ?? Infinity),
      );
      break;
    case 'price_desc':
      cards.sort(
        (a, b) =>
          inStockFirst(a, b) ||
          (b.fromPriceCents ?? -1) - (a.fromPriceCents ?? -1),
      );
      break;
    case 'newest':
      cards.sort((a, b) => inStockFirst(a, b) || b.releaseYear - a.releaseYear);
      break;
    default:
      cards.sort(inStockFirst);
  }

  return cards;
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardDto[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: productInclude,
    orderBy: [{ sortOrder: 'asc' }],
    take: limit,
  });
  return rows.map(toCard).filter((c) => c.fromPriceCents !== null);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetailDto | null> {
  const p = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: productInclude,
  });
  if (!p) return null;

  let specs: Record<string, string> = {};
  if (p.specsJson) {
    try {
      const parsed: unknown = JSON.parse(p.specsJson);
      if (typeof parsed === 'object' && parsed !== null) {
        specs = parsed as Record<string, string>;
      }
    } catch {
      // Malformed specs render as an empty table rather than breaking the
      // page. The product still has to be buyable.
      specs = {};
    }
  }

  return {
    ...toCard(p),
    description: p.description,
    highlights: p.highlights.split('\n').filter(Boolean),
    specs,
    images: p.images.map((i) => ({
      url: i.url,
      alt: i.alt,
      colourName: i.colourName,
    })),
    variants: p.variants.map(toVariantDto),
  };
}

export async function getRelatedProducts(
  product: ProductDetailDto,
  limit = 4,
): Promise<ProductCardDto[]> {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { slug: product.categorySlug },
      id: { not: product.id },
    },
    include: productInclude,
    orderBy: [{ sortOrder: 'asc' }],
    take: limit + 2,
  });
  return rows
    .map(toCard)
    .filter((c) => c.fromPriceCents !== null)
    .slice(0, limit);
}

export function getProductSlugs() {
  return prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
}

/* ------------------------------------------------------------------ */
/* Live stock, for checkout                                            */
/* ------------------------------------------------------------------ */

/**
 * Current stock for a set of variants.
 *
 * Used by the basket to show a shortfall before checkout is attempted. It is
 * advisory: the authority is the conditional decrement in the order
 * transaction, because stock can change between this read and the write.
 */
export async function getStockLevels(variantIds: readonly string[]) {
  if (variantIds.length === 0) return [];
  const rows = await prisma.variant.findMany({
    where: { id: { in: [...variantIds] } },
    select: {
      id: true,
      stockQuantity: true,
      isActive: true,
      priceCents: true,
    },
  });
  return rows.map((r) => ({
    variantId: r.id,
    stockQuantity: r.stockQuantity,
    isActive: r.isActive,
    priceCents: r.priceCents,
  }));
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

/**
 * Catalogue search.
 *
 * Matches the product name, tagline and category. Deliberately simple: the
 * catalogue is a few dozen models and somebody typing "iphone 14" wants the
 * iPhone 14, not a relevance-ranked guess.
 */
export async function searchProducts(
  query: string,
  limit = 20,
): Promise<ProductCardDto[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { tagline: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ],
    },
    include: productInclude,
    orderBy: [{ sortOrder: 'asc' }],
    take: limit,
  });

  return rows
    .map(toCard)
    .sort((a, b) => {
      // An exact-ish name match ranks above a category match.
      const aName = a.name.toLowerCase().includes(q.toLowerCase());
      const bName = b.name.toLowerCase().includes(q.toLowerCase());
      return Number(bName) - Number(aName);
    });
}
