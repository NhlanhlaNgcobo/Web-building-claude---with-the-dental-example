import type { Metadata } from 'next';
import {
  absoluteUrl,
  clinic,
  formatAddressOneLine,
  siteUrl,
} from '@/data/clinic';

/**
 * SEO helpers.
 *
 * Titles and descriptions are written for the person reading the search
 * result, not stuffed with terms. "Dentist in Durban" appears where it is the
 * natural way to describe the practice and nowhere else.
 */

const SITE_NAME = clinic.name;

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
 * Opening hours in the format schema.org expects.
 * Sunday is omitted rather than listed as closed, which is how a closed day is
 * correctly represented in OpeningHoursSpecification.
 */
function openingHoursSpecification() {
  const dayNames: Record<string, string> = {
    Monday: 'Monday',
    Tuesday: 'Tuesday',
    Wednesday: 'Wednesday',
    Thursday: 'Thursday',
    Friday: 'Friday',
    Saturday: 'Saturday',
    Sunday: 'Sunday',
  };

  return clinic.openingHours
    .filter((day) => day.opens !== null)
    .map((day) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${dayNames[day.day]}`,
      opens: day.opens,
      closes: day.closes,
    }));
}

const postalAddress = {
  '@type': 'PostalAddress',
  streetAddress: `${clinic.address.line1}, ${clinic.address.line2}`,
  addressLocality: clinic.address.suburb,
  addressRegion: clinic.address.province,
  postalCode: clinic.address.postalCode,
  addressCountry: clinic.address.countryCode,
};

/**
 * The practice itself, as a Dentist, which is a subtype of both
 * MedicalBusiness and LocalBusiness. Using the specific type rather than a
 * generic LocalBusiness is what lets search engines understand what this is.
 *
 * Deliberately absent: aggregateRating and review. Publishing either without
 * genuine, verifiable reviews behind it would be fabrication, and search
 * engines treat invented review markup as a manipulation.
 */
export function dentistSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    '@id': `${siteUrl()}/#practice`,
    name: clinic.name,
    description:
      'A private dental practice on Florida Road in Morningside, Durban, offering examinations, hygiene, restorative and cosmetic treatment, and same-day urgent appointments.',
    url: siteUrl(),
    telephone: clinic.telephone.e164,
    email: clinic.email,
    address: postalAddress,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: clinic.geo.latitude,
      longitude: clinic.geo.longitude,
    },
    openingHoursSpecification: openingHoursSpecification(),
    currenciesAccepted: 'ZAR',
    areaServed: [
      { '@type': 'City', name: 'Durban' },
      { '@type': 'AdministrativeArea', name: 'KwaZulu-Natal' },
    ],
    availableService: [
      { '@type': 'MedicalProcedure', name: 'Dental examination' },
      { '@type': 'MedicalProcedure', name: 'Professional cleaning' },
      { '@type': 'MedicalProcedure', name: 'Dental fillings' },
      { '@type': 'MedicalProcedure', name: 'Root canal treatment' },
      { '@type': 'MedicalProcedure', name: 'Crowns and bridges' },
      { '@type': 'MedicalProcedure', name: 'Teeth whitening' },
      { '@type': 'MedicalProcedure', name: 'Dental implants' },
      { '@type': 'MedicalProcedure', name: 'Emergency dentistry' },
    ],
  };
}

/** A named dentist, linked back to the practice. */
export function dentistPersonSchema(dentist: {
  slug: string;
  title: string;
  firstName: string;
  lastName: string;
  role: string;
  photoUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': absoluteUrl(`/team/${dentist.slug}#person`),
    name: `${dentist.title} ${dentist.firstName} ${dentist.lastName}`,
    jobTitle: dentist.role,
    image: dentist.photoUrl,
    url: absoluteUrl(`/team/${dentist.slug}`),
    worksFor: { '@id': `${siteUrl()}/#practice` },
  };
}

export function breadcrumbSchema(
  items: readonly { name: string; path: string }[],
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

export function faqSchema(faqs: readonly { question: string; answer: string }[]) {
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

/** Structured data for a treatment page. */
export function treatmentSchema(treatment: {
  name: string;
  slug: string;
  summary: string;
  priceFromCents: number | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: treatment.name,
    description: treatment.summary,
    url: absoluteUrl(`/treatments/${treatment.slug}`),
    procedureType: 'https://schema.org/TherapeuticProcedure',
    provider: { '@id': `${siteUrl()}/#practice` },
  };
}

export function productSchema(product: {
  slug: string;
  name: string;
  shortDescription: string;
  priceCents: number;
  imageUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    image: product.imageUrl,
    url: absoluteUrl(`/shop/${product.slug}`),
    brand: { '@type': 'Brand', name: clinic.name },
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: 'ZAR',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/shop/${product.slug}`),
      seller: { '@id': `${siteUrl()}/#practice` },
    },
  };
}

/** Render a JSON-LD block. Call with one or more schema objects. */
export function JsonLd({ schema }: { readonly schema: unknown }) {
  return (
    <script
      type="application/ld+json"
      // The content is generated from our own configuration, never from user
      // input, so there is nothing here that could carry an injection.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export const addressOneLine = formatAddressOneLine;
