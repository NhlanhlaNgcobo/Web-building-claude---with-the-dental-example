/**
 * Store identity and contact configuration.
 *
 * Everything the site shows about who and where the business is lives here,
 * so none of it is scattered through components. The contact details and
 * address below are placeholders for development and must be replaced before
 * launch. See the checklist in README.md.
 */

export const store = {
  name: 'The Apple Bros',
  legalName: 'The Apple Bros',
  tagline: 'Apple, without the Apple price',

  /**
   * Stated plainly and repeated wherever it matters.
   *
   * We sell Apple products; we are not Apple and not an authorised reseller.
   * Saying so clearly protects the customer, who needs to know whose warranty
   * they have, and protects the business, because implying an affiliation
   * that does not exist is a trademark problem rather than a marketing
   * flourish.
   */
  independenceNotice:
    'The Apple Bros is an independent retailer. We are not affiliated with, authorised by, or endorsed by Apple Inc. Apple, iPhone, iPad, MacBook, Apple Watch and AirPods are trademarks of Apple Inc.',

  telephone: {
    display: '011 100 2600',
    e164: '+27111002600',
  },

  whatsapp: {
    display: '060 100 2600',
    number: '27601002600',
  },

  email: 'hello@theapplebros.co.za',

  address: {
    line1: 'Shop 12, The Zone',
    line2: '177 Oxford Road',
    suburb: 'Rosebank',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2196',
    country: 'South Africa',
    countryCode: 'ZA',
  },

  geo: {
    latitude: -26.1448,
    longitude: 28.0436,
  },

  openingHours: [
    { day: 'Monday', opens: '09:00', closes: '18:00' },
    { day: 'Tuesday', opens: '09:00', closes: '18:00' },
    { day: 'Wednesday', opens: '09:00', closes: '18:00' },
    { day: 'Thursday', opens: '09:00', closes: '18:00' },
    { day: 'Friday', opens: '09:00', closes: '18:00' },
    { day: 'Saturday', opens: '09:00', closes: '15:00' },
    { day: 'Sunday', opens: null, closes: null },
  ],

  parking: 'Undercover parking at The Zone, first hour free.',

  /* ---------------------------------------------------------------- */
  /* Commerce policy                                                   */
  /* ---------------------------------------------------------------- */

  /**
   * Free delivery above this, in cents. A threshold is only worth stating if
   * it is real and consistent, so it lives here rather than in copy.
   */
  freeDeliveryThresholdCents: 150_000,
  standardDeliveryCents: 12_500,

  /**
   * Days to return an unwanted item.
   *
   * South Africa's Consumer Protection Act gives a 7 day cooling-off right on
   * goods bought at a distance. We offer 14, which is more than the minimum
   * and simpler to explain than a right that varies by how you bought.
   */
  returnWindowDays: 14,

  /** Our own warranty on used stock, in months. Not Apple's. */
  usedWarrantyMonths: 12,
  /** New sealed stock carries the manufacturer's own warranty. */
  newWarrantyMonths: 12,

  /** Working days to deliver nationally. */
  deliveryDays: { min: 2, max: 4 },

  social: {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
  },
} as const;

export function addressLines(): string[] {
  const a = store.address;
  return [a.line1, a.line2, a.suburb, `${a.city}, ${a.postalCode}`];
}

export function formatAddressOneLine(): string {
  const a = store.address;
  return `${a.line1}, ${a.line2}, ${a.suburb}, ${a.city}, ${a.postalCode}`;
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${store.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export const whatsappIntents = {
  general: 'Hi, I have a question about an order at The Apple Bros.',
  stock: 'Hi, I would like to check stock on a device at The Apple Bros.',
  tradeIn: 'Hi, I would like to ask about trading in a device.',
  support: 'Hi, I need help with something I bought from The Apple Bros.',
} as const;

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
}

export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl()}${suffix === '/' ? '' : suffix}`;
}
