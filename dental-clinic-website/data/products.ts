import type { ProductCategory } from '@/lib/domain/enums';
import { productImages } from './images';

/**
 * The practice shop: a short, curated list of things we actually recommend,
 * rather than a general retail catalogue.
 *
 * Product copy is factual about what each item is and how it is used. It makes
 * no claims about treating or preventing disease, and where suitability varies
 * between people the copy says so and points back to an appointment.
 */

export interface ProductSeed {
  readonly slug: string;
  readonly name: string;
  readonly category: ProductCategory;
  readonly shortDescription: string;
  readonly description: string;
  /** What is in the box. */
  readonly includes?: readonly string[];
  /** How it is used, kept brief and practical. */
  readonly usageNotes?: string;
  readonly priceCents: number;
  readonly imageUrl: string;
  readonly sortOrder: number;
}

export const productSeeds: readonly ProductSeed[] = [
  {
    slug: 'home-whitening-kit',
    name: 'Harbour Dental Studio Home Whitening Kit',
    category: 'whitening',
    shortDescription:
      'Custom-fitted trays and professional gel, dispensed after a whitening consultation.',
    description:
      'Our take-home kit pairs trays made from impressions of your own teeth with professional whitening gel. A tray made to fit holds the gel against the teeth and away from the gums, which is what makes the result even and keeps the process comfortable.\n\nWhitening suits many people but not everyone, and results vary with your natural tooth colour and the type of staining. Existing crowns, veneers and white fillings do not change colour, so if you have any in your smile line they need planning around. For those reasons this kit is dispensed after a whitening consultation rather than sold on its own.',
    includes: [
      'Upper and lower trays made from impressions of your teeth',
      'Professional whitening gel syringes',
      'A storage case',
      'Written instructions and a shade record from your consultation',
    ],
    usageNotes:
      'Worn for the period agreed at your consultation, usually over a course of consecutive days. Use only the amount of gel shown to you, and stop and contact us if your gums become sore.',
    priceCents: 145_000,
    imageUrl: productImages['home-whitening-kit']!,
    sortOrder: 10,
  },
  {
    slug: 'sensitive-toothpaste',
    name: 'Sensitive toothpaste',
    category: 'oral_care',
    shortDescription:
      'A daily fluoride toothpaste formulated for teeth that react to cold.',
    description:
      'A daily toothpaste for people whose teeth are sensitive to cold air, cold drinks or brushing. It is used in place of your normal toothpaste rather than alongside it, and it generally takes a couple of weeks of consistent use before the difference is noticeable.\n\nSensitivity has several possible causes, including exposed root surfaces, worn enamel and, occasionally, a problem inside a tooth. If sensitivity is limited to one tooth, is getting worse, or lingers after the cold is removed, it is worth having looked at rather than managed with toothpaste.',
    usageNotes:
      'Use twice daily in place of your usual toothpaste. Brushing a small amount onto the sensitive area with a finger and leaving it rather than rinsing can help.',
    priceCents: 14_500,
    imageUrl: productImages['sensitive-toothpaste']!,
    sortOrder: 20,
  },
  {
    slug: 'electric-toothbrush',
    name: 'Rechargeable electric toothbrush',
    category: 'oral_care',
    shortDescription:
      'An oscillating brush with a pressure sensor and a two minute timer.',
    description:
      'The two features that make the difference on an electric brush are a pressure sensor and a timer. The sensor tells you when you are pressing too hard, which is the most common cause of worn enamel and receding gums in people who brush diligently. The timer stops the guesswork about how long two minutes actually is.\n\nThis model is rechargeable, comes with a travel case, and takes the standard brush heads we stock, so replacements are easy to get hold of at your next visit.',
    includes: [
      'Handle and charging stand',
      'Two brush heads',
      'Travel case',
    ],
    usageNotes:
      'Guide the brush slowly along the gum line and let it do the work rather than scrubbing. Replace the head every three months, or sooner if the bristles splay.',
    priceCents: 129_000,
    imageUrl: productImages['electric-toothbrush']!,
    sortOrder: 30,
  },
  {
    slug: 'replacement-brush-heads',
    name: 'Replacement brush heads, pack of four',
    category: 'accessories',
    shortDescription:
      'A year of replacements for the rechargeable electric toothbrush.',
    description:
      'Four replacement heads, which at the recommended three month interval is a year of brushing. Worn bristles clean noticeably less well, and splayed bristles are also more likely to irritate the gum margin.\n\nThese fit the rechargeable electric toothbrush we stock. If you use a different brush, bring the handle or the old head to your next appointment and we will tell you whether these fit.',
    priceCents: 32_000,
    imageUrl: productImages['replacement-brush-heads']!,
    sortOrder: 40,
  },
  {
    slug: 'interdental-brushes',
    name: 'Interdental brushes, mixed sizes',
    category: 'oral_care',
    shortDescription:
      'Small tapered brushes for the spaces between teeth, in a range of widths.',
    description:
      'A toothbrush cleans the outer and inner surfaces of a tooth but reaches very little of the two surfaces that face the neighbouring teeth. Those contact areas are where decay and gum inflammation most often begin, and for many people an interdental brush reaches them better than floss does.\n\nSizing matters more than people expect: a brush that is too small does nothing, and one that is too large will not pass through. This pack has a range of widths so you can find what fits, and we are happy to show you which size suits which gap at your next appointment.',
    usageNotes:
      'Insert gently and work back and forth a few times. Do not force a brush that will not pass through; use a smaller size. Daily use, usually easiest in the evening.',
    priceCents: 12_000,
    imageUrl: productImages['interdental-brushes']!,
    sortOrder: 50,
  },
  {
    slug: 'waxed-dental-floss',
    name: 'Waxed dental floss',
    category: 'oral_care',
    shortDescription:
      'Waxed floss that slides between tight contacts without shredding.',
    description:
      'Waxed floss passes between tightly packed teeth more easily than unwaxed and is much less likely to fray on a rough filling margin or a tight contact. Where teeth sit close together it reaches places an interdental brush cannot fit into.\n\nIf your floss consistently shreds in the same spot, mention it. That often indicates a rough edge or a defective filling margin worth checking.',
    usageNotes:
      'Use a fresh section for each gap, curve it around each tooth in turn and clean just below the gum margin rather than snapping it down onto the gum.',
    priceCents: 9_500,
    imageUrl: productImages['waxed-dental-floss']!,
    sortOrder: 60,
  },
  {
    slug: 'alcohol-free-mouthwash',
    name: 'Alcohol-free mouthwash',
    category: 'oral_care',
    shortDescription:
      'A daily fluoride rinse without alcohol, so it does not sting or dry the mouth.',
    description:
      'An alcohol-free daily fluoride rinse. Without alcohol it does not sting, which makes it more comfortable for people with sensitive soft tissues, recent treatment, or a dry mouth caused by medication.\n\nA rinse is an addition to brushing and cleaning between the teeth, not a replacement for either. Used at a different time of day from brushing, it tops up fluoride contact without washing away the toothpaste you have just applied.',
    usageNotes:
      'Rinse once daily at a different time from brushing, and avoid eating or drinking for about half an hour afterwards.',
    priceCents: 13_500,
    imageUrl: productImages['alcohol-free-mouthwash']!,
    sortOrder: 70,
  },
  {
    slug: 'travel-care-kit',
    name: 'Travel care kit',
    category: 'accessories',
    shortDescription:
      'A compact zipped case with the essentials, sized for hand luggage.',
    description:
      'A zipped case holding a folding brush, a travel tube of fluoride toothpaste, floss and a set of interdental brushes. The contents are sized to meet hand luggage liquid limits, and the case is firm enough to keep a brush head clean in a bag.\n\nUseful for anyone who travels regularly for work, and a sensible thing to keep packed rather than assembled the night before a trip.',
    includes: [
      'Folding travel toothbrush',
      'Travel tube of fluoride toothpaste',
      'Floss',
      'Interdental brushes',
      'Zipped case',
    ],
    priceCents: 38_500,
    imageUrl: productImages['travel-care-kit']!,
    sortOrder: 80,
  },
  {
    slug: 'post-treatment-care-pack',
    name: 'Post-treatment care pack',
    category: 'aftercare',
    shortDescription:
      'Gentle brush, alcohol-free rinse and gauze for the days after a procedure.',
    description:
      'Assembled for the first week after an extraction, implant placement or gum treatment, when the area is tender and normal brushing is uncomfortable. It contains an extra-soft brush, an alcohol-free rinse that will not sting, sterile gauze and a curved syringe for gently irrigating a healing socket.\n\nThis pack supports the written aftercare instructions you are given at your appointment; it does not replace them. If you are concerned about healing, bleeding or increasing pain, phone the practice rather than waiting.',
    includes: [
      'Extra-soft bristled toothbrush',
      'Alcohol-free rinse',
      'Sterile gauze',
      'Curved irrigation syringe',
    ],
    priceCents: 29_500,
    imageUrl: productImages['post-treatment-care-pack']!,
    sortOrder: 90,
  },
];

export function getProductSeed(slug: string): ProductSeed | undefined {
  return productSeeds.find((p) => p.slug === slug);
}

/** The whitening kit gets a dedicated feature block on the shop and home pages. */
export const FEATURED_PRODUCT_SLUG = 'home-whitening-kit';
