/**
 * Clinic identity and contact configuration.
 *
 * Everything the public site shows about who and where the practice is lives
 * here, so none of it is scattered through components. The contact details,
 * registration line and map coordinates below are placeholders for development
 * and must be replaced with the practice's real details before launch. See the
 * "Before you launch" checklist in README.md.
 */

export const clinic = {
  name: 'Harbour Dental Studio',
  shortName: 'Harbour Dental',
  /** Used in page titles after the separator. */
  legalName: 'Harbour Dental Studio',
  tagline: 'Modern dentistry in Durban',

  telephone: {
    display: '031 100 4500',
    /** E.164, for tel: links. */
    e164: '+27311004500',
  },

  whatsapp: {
    display: '060 100 4500',
    /** Digits only, for wa.me links. */
    number: '27601004500',
  },

  email: 'reception@harbourdental.co.za',

  address: {
    line1: 'Shop 4, Florida Court',
    line2: '275 Florida Road',
    suburb: 'Morningside',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    postalCode: '4001',
    country: 'South Africa',
    countryCode: 'ZA',
  },

  /** Used for the map embed and LocalBusiness structured data. */
  geo: {
    latitude: -29.8323,
    longitude: 31.0128,
  },

  parking: {
    summary: 'Secure on-site parking behind the building.',
    detail:
      'Turn into the service lane beside the building and follow the signs to the visitor bays at the rear. There is a guard on duty during opening hours, and street parking on Florida Road is metered on weekdays.',
  },

  directions: [
    {
      from: 'From the N3 and the city centre',
      detail:
        'Take the Sandile Thusi Road exit, continue east, then turn left into Florida Road. The practice is on the right after the Innes Road intersection.',
    },
    {
      from: 'From Umhlanga and the north',
      detail:
        'Follow the M4 south, exit at Argyle Road and continue to Florida Road. The practice is on the left before Lillian Ngoyi Road.',
    },
    {
      from: 'From Westville and the west',
      detail:
        'Take the N3 east to the M13, join Peter Mokaba Ridge, then turn into Florida Road at Morningside.',
    },
  ],

  /**
   * Opening hours for display. The authoritative hours used by the booking
   * engine live in the ClinicHours table and are set by prisma/seed.ts, so that
   * staff can change them without a deployment. These two must be kept in step.
   */
  openingHours: [
    { day: 'Monday', opens: '08:00', closes: '17:00' },
    { day: 'Tuesday', opens: '08:00', closes: '17:00' },
    { day: 'Wednesday', opens: '08:00', closes: '17:00' },
    { day: 'Thursday', opens: '08:00', closes: '17:00' },
    { day: 'Friday', opens: '08:00', closes: '16:00' },
    { day: 'Saturday', opens: '08:00', closes: '13:00' },
    { day: 'Sunday', opens: null, closes: null },
  ],

  /** Shown on the emergency page and in the footer. */
  emergency: {
    summary: 'Same-day appointments are held back each morning for urgent care.',
    /**
     * Deliberate and important: the practice is not an emergency department,
     * and the site must say so plainly rather than implying otherwise.
     */
    hospitalGuidance:
      'For a suspected fracture to the jaw or face, uncontrolled bleeding, difficulty breathing or swallowing, or swelling that is closing your eye or throat, go to your nearest hospital emergency department or call 10177 for an ambulance.',
    ambulanceNumber: '10177',
    nationalEmergencyNumber: '112',
  },

  social: {
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
  },

  /** Cancellation notice, in hours, used by the manage-appointment flow. */
  cancellationNoticeHours: 24,
} as const;

/** A single-line address, for structured data and compact display. */
export function formatAddressOneLine(): string {
  const a = clinic.address;
  return `${a.line1}, ${a.line2}, ${a.suburb}, ${a.city}, ${a.postalCode}`;
}

/** The address as discrete lines, for the footer and contact page. */
export function addressLines(): string[] {
  const a = clinic.address;
  return [a.line1, a.line2, a.suburb, `${a.city}, ${a.postalCode}`];
}

/** Build a wa.me link with a prefilled message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${clinic.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

/** Prefilled WhatsApp messages, so each entry point reads naturally. */
export const whatsappIntents = {
  reception: 'Good day, I would like to speak to reception at Harbour Dental Studio.',
  question: 'Good day, I have a question about treatment at Harbour Dental Studio.',
  appointment: 'Good day, I would like to enquire about an appointment at Harbour Dental Studio.',
  urgent: 'Good day, I need an urgent dental appointment at Harbour Dental Studio.',
} as const;

/** The canonical site origin, without a trailing slash. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
}

/** Absolute URL for a path, used for canonicals and Open Graph. */
export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl()}${suffix === '/' ? '' : suffix}`;
}
