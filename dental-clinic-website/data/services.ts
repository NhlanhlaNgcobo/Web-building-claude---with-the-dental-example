import type { DepositType, ServiceCategory } from '@/lib/domain/enums';

/**
 * Bookable appointment types.
 *
 * A service is the unit that occupies a slot in the diary, which is not the
 * same thing as a treatment. Several treatments share one appointment type,
 * because a crown consultation and a bridge consultation need the same room,
 * the same length of time and the same clinician.
 *
 * Deposit policy lives here and is snapshotted onto the appointment when it is
 * booked, so that changing a fee later cannot alter an existing booking.
 */

export interface ServiceSeed {
  readonly slug: string;
  readonly name: string;
  readonly category: ServiceCategory;
  readonly shortDescription: string;
  readonly durationMinutes: number;
  /** Turnaround held in the diary after the appointment, not shown as part of
   * the patient's appointment length. */
  readonly bufferAfterMinutes: number;
  readonly priceFromCents: number | null;
  readonly depositType: DepositType;
  readonly depositAmountCents: number | null;
  readonly isEmergency: boolean;
  /** Whether aftercare products may be suggested after this appointment. */
  readonly allowsUpsell: boolean;
  readonly sortOrder: number;
  /** Product slugs genuinely relevant to this appointment. */
  readonly relatedProductSlugs: readonly string[];
}

export const serviceSeeds: readonly ServiceSeed[] = [
  {
    slug: 'new-patient-consultation',
    name: 'New patient consultation',
    category: 'general',
    shortDescription:
      'A longer first appointment covering a full examination, a baseline set of images and a written plan.',
    durationMinutes: 45,
    bufferAfterMinutes: 0,
    priceFromCents: 95_000,
    depositType: 'none',
    depositAmountCents: null,
    isEmergency: false,
    allowsUpsell: true,
    sortOrder: 10,
    relatedProductSlugs: ['electric-toothbrush', 'interdental-brushes'],
  },
  {
    slug: 'routine-examination',
    name: 'Routine examination',
    category: 'general',
    shortDescription:
      'Your regular check of teeth, gums and bite, with anything worth watching explained.',
    durationMinutes: 30,
    bufferAfterMinutes: 0,
    priceFromCents: 85_000,
    depositType: 'none',
    depositAmountCents: null,
    isEmergency: false,
    allowsUpsell: true,
    sortOrder: 20,
    relatedProductSlugs: ['electric-toothbrush', 'waxed-dental-floss'],
  },
  {
    slug: 'scale-and-polish',
    name: 'Scale and polish',
    category: 'hygiene',
    shortDescription:
      'Professional cleaning that removes hardened deposits brushing cannot shift.',
    durationMinutes: 45,
    bufferAfterMinutes: 0,
    priceFromCents: 95_000,
    depositType: 'none',
    depositAmountCents: null,
    isEmergency: false,
    allowsUpsell: true,
    sortOrder: 30,
    relatedProductSlugs: ['interdental-brushes', 'electric-toothbrush'],
  },
  {
    slug: 'emergency-consultation',
    name: 'Emergency consultation',
    category: 'emergency',
    shortDescription:
      'A same-day appointment for pain, swelling, a broken tooth or a lost filling.',
    durationMinutes: 30,
    bufferAfterMinutes: 0,
    priceFromCents: 110_000,
    depositType: 'required',
    depositAmountCents: 25_000,
    isEmergency: true,
    // No product recommendations are shown during or after an urgent booking.
    allowsUpsell: false,
    sortOrder: 5,
    relatedProductSlugs: [],
  },
  {
    slug: 'whitening-consultation',
    name: 'Teeth whitening consultation',
    category: 'cosmetic',
    shortDescription:
      'An assessment of whether whitening suits you, your starting shade and the options.',
    durationMinutes: 30,
    bufferAfterMinutes: 0,
    priceFromCents: 65_000,
    depositType: 'required',
    depositAmountCents: 30_000,
    isEmergency: false,
    allowsUpsell: true,
    sortOrder: 40,
    relatedProductSlugs: ['home-whitening-kit', 'sensitive-toothpaste'],
  },
  {
    slug: 'filling-consultation',
    name: 'Filling appointment',
    category: 'restorative',
    shortDescription:
      'Tooth-coloured composite to repair a tooth after decay or a chip.',
    durationMinutes: 45,
    bufferAfterMinutes: 0,
    priceFromCents: 125_000,
    depositType: 'none',
    depositAmountCents: null,
    isEmergency: false,
    allowsUpsell: true,
    sortOrder: 50,
    relatedProductSlugs: ['sensitive-toothpaste'],
  },
  {
    slug: 'crown-consultation',
    name: 'Crown consultation',
    category: 'restorative',
    shortDescription:
      'An assessment for a crown, bridge or other laboratory-made restoration, with a written plan.',
    durationMinutes: 45,
    // Longer room turnaround after a preparation appointment.
    bufferAfterMinutes: 15,
    priceFromCents: 95_000,
    depositType: 'none',
    depositAmountCents: null,
    isEmergency: false,
    allowsUpsell: true,
    sortOrder: 60,
    relatedProductSlugs: ['interdental-brushes', 'waxed-dental-floss'],
  },
  {
    slug: 'implant-consultation',
    name: 'Implant consultation',
    category: 'surgical',
    shortDescription:
      'Assessment and three-dimensional imaging to establish whether an implant is possible.',
    durationMinutes: 45,
    bufferAfterMinutes: 15,
    priceFromCents: 120_000,
    depositType: 'optional',
    depositAmountCents: 50_000,
    isEmergency: false,
    allowsUpsell: true,
    sortOrder: 70,
    relatedProductSlugs: ['interdental-brushes', 'alcohol-free-mouthwash'],
  },
  {
    slug: 'general-consultation',
    name: 'General consultation',
    category: 'general',
    shortDescription:
      'For anything that needs discussing before treatment is planned, including second opinions.',
    durationMinutes: 30,
    bufferAfterMinutes: 0,
    priceFromCents: 85_000,
    depositType: 'none',
    depositAmountCents: null,
    isEmergency: false,
    allowsUpsell: true,
    sortOrder: 80,
    relatedProductSlugs: [],
  },
];

export function getServiceSeed(slug: string): ServiceSeed | undefined {
  return serviceSeeds.find((s) => s.slug === slug);
}

/**
 * The quick selector on the homepage. Each entry maps a complaint in a
 * patient's own words to the appointment type that fits it, so the selector
 * leads straight into the right booking journey rather than to a menu.
 */
export const quickSelectorOptions = [
  { label: 'Check-up', serviceSlug: 'routine-examination', treatmentSlug: 'dental-examination' },
  { label: 'Toothache', serviceSlug: 'emergency-consultation', treatmentSlug: 'emergency-dentistry' },
  { label: 'Teeth cleaning', serviceSlug: 'scale-and-polish', treatmentSlug: 'professional-cleaning' },
  { label: 'Teeth whitening', serviceSlug: 'whitening-consultation', treatmentSlug: 'teeth-whitening' },
  { label: 'Broken tooth', serviceSlug: 'emergency-consultation', treatmentSlug: 'emergency-dentistry' },
  { label: 'Filling', serviceSlug: 'filling-consultation', treatmentSlug: 'fillings' },
  { label: 'Crown', serviceSlug: 'crown-consultation', treatmentSlug: 'crowns' },
  { label: 'Dental emergency', serviceSlug: 'emergency-consultation', treatmentSlug: 'emergency-dentistry' },
] as const;
