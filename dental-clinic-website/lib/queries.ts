import 'server-only';

import { prisma } from '@/lib/db';
import type { DentistCardData } from '@/components/layout/DentistCard';
import type { ProductCardData } from '@/components/shop/ProductCard';
import type { ServiceSummaryDto } from '@/types';
import type { DepositType, ServiceCategory } from '@/lib/domain/enums';

/**
 * Read queries shared across pages.
 *
 * Catalogue data lives in the database rather than being imported straight
 * into components, so that the staff diary and the public site always agree
 * about which dentists exist and which appointment types are bookable.
 */

/* ------------------------------------------------------------------ */
/* Dentists                                                            */
/* ------------------------------------------------------------------ */

export async function getDentists(): Promise<DentistCardData[]> {
  const rows = await prisma.dentist.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return rows.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    firstName: d.firstName,
    lastName: d.lastName,
    role: d.role,
    bio: d.bio,
    // Stored as a newline separated list rather than an array column, because
    // the practice edits these as a block of text and the schema deliberately
    // uses no array types.
    focusAreas: d.focusAreas.split('\n').filter(Boolean),
    photoUrl: d.photoUrl,
  }));
}

export async function getDentistBySlug(
  slug: string,
): Promise<DentistCardData | null> {
  const d = await prisma.dentist.findFirst({
    where: { slug, isActive: true },
  });
  if (!d) return null;
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    firstName: d.firstName,
    lastName: d.lastName,
    role: d.role,
    bio: d.bio,
    focusAreas: d.focusAreas.split('\n').filter(Boolean),
    photoUrl: d.photoUrl,
  };
}

/** Which appointment types a dentist takes, for their profile page. */
export async function getDentistServices(
  dentistId: string,
): Promise<ServiceSummaryDto[]> {
  const rows = await prisma.serviceDentist.findMany({
    where: { dentistId, service: { isActive: true } },
    include: { service: true },
    orderBy: { service: { sortOrder: 'asc' } },
  });
  return rows.map((row) => toServiceSummary(row.service));
}

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

function toServiceSummary(service: {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  durationMinutes: number;
  priceFromCents: number | null;
  depositType: string;
  depositAmountCents: number | null;
  isEmergency: boolean;
  category: string;
}): ServiceSummaryDto {
  return {
    id: service.id,
    slug: service.slug,
    name: service.name,
    shortDescription: service.shortDescription,
    durationMinutes: service.durationMinutes,
    priceFromCents: service.priceFromCents,
    depositType: service.depositType as DepositType,
    depositAmountCents: service.depositAmountCents,
    isEmergency: service.isEmergency,
    category: service.category as ServiceCategory,
  };
}

export async function getBookableServices(): Promise<ServiceSummaryDto[]> {
  const rows = await prisma.service.findMany({
    where: { isActive: true, isBookableOnline: true },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(toServiceSummary);
}

export async function getServiceBySlug(
  slug: string,
): Promise<ServiceSummaryDto | null> {
  const service = await prisma.service.findFirst({
    where: { slug, isActive: true },
  });
  return service ? toServiceSummary(service) : null;
}

/** Dentist ids eligible for a service, used to narrow the booking step. */
export async function getEligibleDentistIds(
  serviceId: string,
): Promise<string[]> {
  const rows = await prisma.serviceDentist.findMany({
    where: { serviceId, dentist: { isActive: true } },
    select: { dentistId: true },
  });
  return rows.map((r) => r.dentistId);
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export async function getProducts(): Promise<ProductCardData[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(toProductCard);
}

function toProductCard(p: {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  priceCents: number;
  imageUrl: string;
}): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({ where: { slug, isActive: true } });
}

export async function getProductsBySlugs(
  slugs: readonly string[],
): Promise<ProductCardData[]> {
  if (slugs.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { slug: { in: [...slugs] }, isActive: true },
  });
  // Preserve the order the caller asked for rather than the database's.
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .map(toProductCard);
}

/* ------------------------------------------------------------------ */
/* Recommendations                                                     */
/* ------------------------------------------------------------------ */

/**
 * Products related to an appointment type, read from the explicit relationship
 * in the data model rather than hard coded per page.
 *
 * Returns nothing at all for a service with upselling switched off, which is
 * how emergency appointments avoid showing commercial offers to somebody in
 * pain. Capped at two, so a recommendation stays a recommendation.
 */
export async function getRelatedProducts(
  serviceId: string,
  limit = 2,
): Promise<ProductCardData[]> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { allowsUpsell: true },
  });
  if (!service?.allowsUpsell) return [];

  const rows = await prisma.serviceProduct.findMany({
    where: { serviceId, product: { isActive: true } },
    include: { product: true },
    orderBy: { sortOrder: 'asc' },
    take: limit,
  });

  return rows.map((row) => toProductCard(row.product));
}

/** The same, addressed by service slug, for treatment pages. */
export async function getRelatedProductsBySlug(
  serviceSlug: string,
  limit = 2,
): Promise<ProductCardData[]> {
  const service = await prisma.service.findFirst({
    where: { slug: serviceSlug },
    select: { id: true },
  });
  if (!service) return [];
  return getRelatedProducts(service.id, limit);
}
