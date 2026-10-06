import type { Metadata } from 'next';
import { absoluteUrl, formatAddressOneLine, siteUrl, store } from '@/data/store';
import { CONDITION_LABELS } from '@/lib/domain/enums';
import type { Faq, ProductDetailDto, VariantDto } from '@/types';

/**
 * SEO helpers.
 *
 * Titles are written for the person reading the search result. "Refurbished
 * iPhone" appears where it is the natural way to describe what is on the page
 * and nowhere else.
 *
 * One rule runs through all of the structured data below: nothing is asserted
 * that is not true on the page. There is no aggregateRating and no review,
 * because there are no genuine reviews to publish, and invented review markup
 * is both a lie to the customer and a manual action waiting to happen.
 */

const SITE_NAME = store.name;

interface PageMetaOptions {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  /** Defaults to the site Open Graph image. */
  readonly image?: string;
  readonly noIndex?: boolean;
  readonly type?: 'website' | 'article';
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  type = 'website',
}: PageMetaOptions): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ?? absoluteUrl('/opengraph-image');

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_ZA',
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Structured data                                                     */
/* ------------------------------------------------------------------ */

/**
 * Sunday is omitted rather than listed as closed, which is how a closed day is
 * correctly represented in OpeningHoursSpecification.
 */
function openingHoursSpecification() {
  return store.openingHours
    .filter((day) => day.opens !== null)
    .map((day) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${day.day}`,
      opens: day.opens,
      closes: day.closes,
    }));
}

const postalAddress = {
  '@type': 'PostalAddress',
  streetAddress: `${store.address.line1}, ${store.address.line2}`,
  addressLocality: store.address.suburb,
  addressRegion: store.address.province,
  postalCode: store.address.postalCode,
  addressCountry: store.address.countryCode,
};

/**
 * The business itself, as a Store.
 *
 * The independence notice travels with the markup rather than living only in
 * page copy, because this is the record a search engine reads about who the
 * seller is. We are the retailer, not the manufacturer.
 */
export function storeSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${siteUrl()}/#store`,
    name: store.name,
    description:
      'An independent South African retailer of refurbished and new Apple devices, with published condition grades, stated battery health and twelve months of cover on used stock.',
    disambiguatingDescription: store.independenceNotice,
    url: siteUrl(),
    telephone: store.telephone.e164,
    email: store.email,
    address: postalAddress,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: store.geo.latitude,
      longitude: store.geo.longitude,
    },
    openingHoursSpecification: openingHoursSpecification(),
    currenciesAccepted: 'ZAR',
    paymentAccepted: 'EFT, card on collection, cash on collection',
    areaServed: { '@type': 'Country', name: 'South Africa' },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl()}/#website`,
    name: store.name,
    url: siteUrl(),
    publisher: { '@id': `${siteUrl()}/#store` },
    inLanguage: 'en-ZA',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl()}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

/**
 * schema.org condition values.
 *
 * Our five grades do not map one to one, and the vocabulary has no term for
 * "excellent". Anything we have put through the workshop is
 * RefurbishedCondition, which is the honest answer even for our top used
 * grade: it has been opened, tested and in some cases had parts replaced, so
 * calling it NewCondition would be wrong however good it looks.
 */
const CONDITION_SCHEMA_URL: Record<string, string> = {
  new: 'https://schema.org/NewCondition',
  pristine: 'https://schema.org/RefurbishedCondition',
  excellent: 'https://schema.org/RefurbishedCondition',
  good: 'https://schema.org/RefurbishedCondition',
  fair: 'https://schema.org/UsedCondition',
};

function offerFor(product: ProductDetailDto, variant: VariantDto) {
  const url = absoluteUrl(`/product/${product.slug}?variant=${variant.id}`);
  return {
    '@type': 'Offer',
    '@id': `${url}#offer`,
    url,
    sku: variant.sku,
    name: `${product.name}, ${CONDITION_LABELS[variant.condition]}`,
    price: (variant.priceCents / 100).toFixed(2),
    priceCurrency: 'ZAR',
    itemCondition:
      CONDITION_SCHEMA_URL[variant.condition] ??
      'https://schema.org/RefurbishedCondition',
    // Availability is read from the same stock number the page renders, so the
    // markup can never advertise something the shop cannot ship.
    availability:
      variant.stockQuantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    warranty: {
      '@type': 'WarrantyPromise',
      durationOfWarranty: {
        '@type': 'QuantitativeValue',
        value: variant.warrantyMonths,
        unitCode: 'MON',
      },
    },
    seller: { '@id': `${siteUrl()}/#store` },
    priceSpecification: {
      '@type': 'PriceSpecification',
      price: (variant.priceCents / 100).toFixed(2),
      priceCurrency: 'ZAR',
      valueAddedTaxIncluded: true,
    },
  };
}

/**
 * A product with one offer per variant.
 *
 * AggregateOffer carries the price range, which is what a search result should
 * show for something sold in several grades, and each individual offer carries
 * its own condition and stock so none of them overstates what is available.
 */
export function productSchema(product: ProductDetailDto) {
  const sellable = product.variants.filter((v) => v.isActive);
  const prices = sellable.map((v) => v.priceCents);
  const images = product.images.map((i) => i.url);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': absoluteUrl(`/product/${product.slug}#product`),
    name: product.name,
    description: product.description,
    image: images.length > 0 ? images : undefined,
    url: absoluteUrl(`/product/${product.slug}`),
    category: product.categoryName,
    releaseDate: String(product.releaseYear),
    offers:
      prices.length === 0
        ? undefined
        : {
            '@type': 'AggregateOffer',
            offerCount: sellable.length,
            lowPrice: (Math.min(...prices) / 100).toFixed(2),
            highPrice: (Math.max(...prices) / 100).toFixed(2),
            priceCurrency: 'ZAR',
            offers: sellable.map((v) => offerFor(product, v)),
          },
  };
}

/** A listing page, as an ordered list of the products shown on it. */
export function itemListSchema(
  items: readonly { readonly slug: string; readonly name: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(`/product/${item.slug}`),
    })),
  };
}

export function breadcrumbSchema(
  items: readonly { readonly name: string; readonly path: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(faqs: readonly Faq[]) {
  if (faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

/** Render a JSON-LD block. Renders nothing when there is no schema to emit. */
export function JsonLd({ schema }: { readonly schema: unknown }) {
  if (schema === null || schema === undefined) return null;
  return (
    <script
      type="application/ld+json"
      // Generated from our own configuration and database, never from user
      // input, so there is nothing here that could carry an injection.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export const addressOneLine = formatAddressOneLine;
