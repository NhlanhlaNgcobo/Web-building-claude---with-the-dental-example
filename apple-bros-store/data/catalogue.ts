import type { Condition, ProductFamily } from '@/lib/domain/enums';
import { categoryImages } from './images';

/**
 * The catalogue.
 *
 * Prices are indicative South African retail in cents, including VAT, and
 * reflect roughly what this market pays. Confirm every one against the shop's
 * actual buying before launch.
 *
 * Note what compareAtCents means: the current price of the equivalent new
 * device, so the saving shown is a real comparison a customer could check.
 * It is never set to manufacture a discount, and it is left null wherever
 * there is no honest comparison to draw.
 */

export interface CategorySeed {
  readonly slug: string;
  readonly family: ProductFamily;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly sortOrder: number;
}

export const categorySeeds: readonly CategorySeed[] = [
  {
    slug: 'iphone',
    family: 'iphone',
    name: 'iPhone',
    tagline: 'Every model graded, tested and guaranteed',
    description:
      'From the current generation sealed in its box to a three year old handset that still does everything most people need. Each one is graded against a published scale and carries twelve months of our own cover.',
    sortOrder: 10,
  },
  {
    slug: 'mac',
    family: 'mac',
    name: 'Mac',
    tagline: 'Laptops that have plenty left in them',
    description:
      'MacBook Air and MacBook Pro, battery tested and cycle counted. A three year old Air with a healthy battery will outlast a new budget laptop, and costs about the same.',
    sortOrder: 20,
  },
  {
    slug: 'ipad',
    family: 'ipad',
    name: 'iPad',
    tagline: 'For reading, drawing and everything in between',
    description:
      'iPad Air and the standard iPad, with the screen checked for pressure marks and the battery health recorded before anything is listed.',
    sortOrder: 30,
  },
  {
    slug: 'watch',
    family: 'watch',
    name: 'Apple Watch',
    tagline: 'With a new band, every time',
    description:
      "Every watch ships with a brand new band, because nobody wants somebody elses. Cases are graded on the same scale as everything else.",
    sortOrder: 40,
  },
  {
    slug: 'audio',
    family: 'audio',
    name: 'Audio',
    tagline: 'AirPods, cleaned and fitted with new tips',
    description:
      'AirPods are sanitised and fitted with new silicone tips before they are listed. Battery life on the buds and the case is measured and stated.',
    sortOrder: 50,
  },
  {
    slug: 'accessories',
    family: 'accessories',
    name: 'Accessories',
    tagline: 'Cables, cases and chargers that are not rubbish',
    description:
      'The things that get lost and the things that fail. All new, all tested with the devices we sell, none of them the cheapest thing we could find.',
    sortOrder: 60,
  },
];

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export interface VariantSeed {
  readonly storageGb: number | null;
  readonly colourName: string;
  readonly colourHex: string;
  readonly condition: Condition;
  readonly priceCents: number;
  readonly compareAtCents: number | null;
  readonly stockQuantity: number;
  readonly batteryHealthMin: number | null;
  readonly warrantyMonths: number;
  readonly conditionNote?: string;
}

export interface ProductSeed {
  readonly slug: string;
  readonly categorySlug: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly specs: Readonly<Record<string, string>>;
  readonly releaseYear: number;
  readonly isFeatured: boolean;
  readonly sortOrder: number;
  readonly variants: readonly VariantSeed[];
}

/** Shorthand: a used variant, which always carries our own cover. */
function used(
  storageGb: number | null,
  colourName: string,
  colourHex: string,
  condition: Condition,
  priceCents: number,
  compareAtCents: number | null,
  stockQuantity: number,
  batteryHealthMin: number,
  conditionNote?: string,
): VariantSeed {
  return {
    storageGb,
    colourName,
    colourHex,
    condition,
    priceCents,
    compareAtCents,
    stockQuantity,
    batteryHealthMin,
    warrantyMonths: 12,
    ...(conditionNote ? { conditionNote } : {}),
  };
}

/** Shorthand: sealed stock, carrying the manufacturer warranty. */
function sealed(
  storageGb: number | null,
  colourName: string,
  colourHex: string,
  priceCents: number,
  compareAtCents: number | null,
  stockQuantity: number,
): VariantSeed {
  return {
    storageGb,
    colourName,
    colourHex,
    condition: 'new',
    priceCents,
    compareAtCents,
    stockQuantity,
    batteryHealthMin: null,
    warrantyMonths: 12,
  };
}

export const productSeeds: readonly ProductSeed[] = [
  /* ---------------------------- iPhone ---------------------------- */
  {
    slug: 'iphone-16-pro',
    categorySlug: 'iphone',
    name: 'iPhone 16 Pro',
    tagline: 'The current Pro, sealed or as good as',
    description:
      'The newest Pro we stock. Titanium frame, the 48 megapixel main camera, and the first iPhone with a dedicated camera control button. If you want the best camera in a phone and intend to keep it for years, this is the one.\n\nOur sealed stock is untouched in its original box. The pristine units are open-box and display stock that have barely been switched on.',
    highlights: [
      'Titanium frame, lighter than the stainless steel it replaced',
      '48 megapixel main camera with a 5x telephoto on the Pro Max',
      'A18 Pro chip, which will see software updates for years yet',
      'USB-C, so one cable for the phone and the laptop',
    ],
    specs: {
      Display: '6.3 inch Super Retina XDR, 120Hz ProMotion',
      Chip: 'A18 Pro',
      'Main camera': '48MP fusion, 48MP ultra wide, 12MP telephoto',
      'Front camera': '12MP TrueDepth',
      Battery: 'Up to 27 hours video playback',
      Connector: 'USB-C',
      'Water resistance': 'IP68, 6 metres for 30 minutes',
      Released: 'September 2024',
    },
    releaseYear: 2024,
    isFeatured: true,
    sortOrder: 10,
    variants: [
      sealed(256, 'Black Titanium', '#3B3B3D', 2_799_900, null, 4),
      sealed(256, 'Natural Titanium', '#C2BCB2', 2_799_900, null, 2),
      sealed(512, 'Black Titanium', '#3B3B3D', 3_249_900, null, 1),
      used(256, 'Black Titanium', '#3B3B3D', 'pristine', 2_449_900, 2_799_900, 3, 98),
      used(256, 'Natural Titanium', '#C2BCB2', 'excellent', 2_299_900, 2_799_900, 5, 94),
      used(512, 'Black Titanium', '#3B3B3D', 'excellent', 2_649_900, 3_249_900, 2, 93),
      used(256, 'Black Titanium', '#3B3B3D', 'good', 2_149_900, 2_799_900, 2, 90),
    ],
  },
  {
    slug: 'iphone-16',
    categorySlug: 'iphone',
    name: 'iPhone 16',
    tagline: 'Everything most people need, nothing they do not',
    description:
      'The standard iPhone 16 does almost everything the Pro does for a good deal less. You lose the telephoto lens and the always-on display; you keep the current chip, the camera control button and USB-C.\n\nFor most people this is the sensible buy, and the gap between it and the Pro is smaller than the price difference suggests.',
    highlights: [
      'A18 chip, the same generation as the Pro',
      '48 megapixel main camera',
      'Camera control button',
      'USB-C charging',
    ],
    specs: {
      Display: '6.1 inch Super Retina XDR, 60Hz',
      Chip: 'A18',
      'Main camera': '48MP fusion, 12MP ultra wide',
      'Front camera': '12MP TrueDepth',
      Battery: 'Up to 22 hours video playback',
      Connector: 'USB-C',
      'Water resistance': 'IP68, 6 metres for 30 minutes',
      Released: 'September 2024',
    },
    releaseYear: 2024,
    isFeatured: true,
    sortOrder: 20,
    variants: [
      sealed(128, 'Ultramarine', '#9FB2DE', 1_949_900, null, 5),
      sealed(256, 'Teal', '#A6C8C4', 2_199_900, null, 3),
      used(128, 'Ultramarine', '#9FB2DE', 'pristine', 1_729_900, 1_949_900, 4, 97),
      used(128, 'Black', '#3B3B3D', 'excellent', 1_629_900, 1_949_900, 6, 93),
      used(256, 'Teal', '#A6C8C4', 'excellent', 1_849_900, 2_199_900, 3, 92),
      used(128, 'Black', '#3B3B3D', 'good', 1_499_900, 1_949_900, 4, 88),
    ],
  },
  {
    slug: 'iphone-15-pro',
    categorySlug: 'iphone',
    name: 'iPhone 15 Pro',
    tagline: "The previous Pro, at a far more sensible price",
    description:
      'The 15 Pro was the first titanium iPhone and the first Pro with USB-C. A year on, it does everything the 16 Pro does barring the camera control button, and costs meaningfully less.\n\nThis is the value buy in the Pro line and the one we recommend most often.',
    highlights: [
      'Titanium frame and the Action button',
      '48 megapixel main camera with 3x telephoto',
      'A17 Pro chip, still comfortably fast',
      'USB-C',
    ],
    specs: {
      Display: '6.1 inch Super Retina XDR, 120Hz ProMotion',
      Chip: 'A17 Pro',
      'Main camera': '48MP main, 12MP ultra wide, 12MP telephoto',
      'Front camera': '12MP TrueDepth',
      Battery: 'Up to 23 hours video playback',
      Connector: 'USB-C',
      'Water resistance': 'IP68, 6 metres for 30 minutes',
      Released: 'September 2023',
    },
    releaseYear: 2023,
    isFeatured: true,
    sortOrder: 30,
    variants: [
      used(128, 'Blue Titanium', '#5A6B7B', 'pristine', 1_899_900, 2_449_900, 2, 96),
      used(256, 'Natural Titanium', '#C2BCB2', 'pristine', 2_049_900, 2_649_900, 3, 95),
      used(128, 'Black Titanium', '#3B3B3D', 'excellent', 1_749_900, 2_449_900, 7, 92),
      used(256, 'Blue Titanium', '#5A6B7B', 'excellent', 1_899_900, 2_649_900, 4, 91),
      used(128, 'Natural Titanium', '#C2BCB2', 'good', 1_599_900, 2_449_900, 5, 88),
      used(
        256,
        'Black Titanium',
        '#3B3B3D',
        'fair',
        1_499_900,
        2_649_900,
        2,
        84,
        'Visible scuff on the bottom left corner of the frame',
      ),
    ],
  },
  {
    slug: 'iphone-14',
    categorySlug: 'iphone',
    name: 'iPhone 14',
    tagline: 'The value pick, and it is not close',
    description:
      'Three years old, and still perfectly good. The 14 has the camera, the screen and the battery life that most people will ever need, and it is less than half what the current Pro costs.\n\nIf somebody asks us what to buy on a budget, this is the answer almost every time.',
    highlights: [
      'A15 Bionic, the same chip as the 13 Pro',
      '12 megapixel dual camera with Photonic Engine',
      'Crash detection and satellite SOS',
      'Lightning connector rather than USB-C',
    ],
    specs: {
      Display: '6.1 inch Super Retina XDR, 60Hz',
      Chip: 'A15 Bionic',
      'Main camera': '12MP main, 12MP ultra wide',
      'Front camera': '12MP TrueDepth',
      Battery: 'Up to 20 hours video playback',
      Connector: 'Lightning',
      'Water resistance': 'IP68, 6 metres for 30 minutes',
      Released: 'September 2022',
    },
    releaseYear: 2022,
    isFeatured: true,
    sortOrder: 40,
    variants: [
      used(128, 'Midnight', '#2E3038', 'excellent', 1_099_900, 1_649_900, 8, 92),
      used(128, 'Starlight', '#EDE6DD', 'excellent', 1_099_900, 1_649_900, 5, 91),
      used(256, 'Blue', '#A3C4DA', 'excellent', 1_249_900, 1_849_900, 3, 90),
      used(128, 'Midnight', '#2E3038', 'good', 999_900, 1_649_900, 9, 87),
      used(128, 'Purple', '#D0CBE8', 'good', 999_900, 1_649_900, 4, 86),
      used(128, 'Starlight', '#EDE6DD', 'fair', 899_900, 1_649_900, 6, 83),
    ],
  },
  {
    slug: 'iphone-13',
    categorySlug: 'iphone',
    name: 'iPhone 13',
    tagline: 'A first smartphone that will not embarrass anyone',
    description:
      'Four years old and still supported. The 13 remains a genuinely good phone: the battery life was a step up over the 12, and the camera holds up.\n\nThe obvious choice for a first phone, a spare, or anyone who simply does not want to spend more.',
    highlights: [
      'A15 Bionic, still receiving software updates',
      'Noticeably better battery life than the iPhone 12',
      '12 megapixel dual camera with sensor-shift stabilisation',
      'Lightning connector',
    ],
    specs: {
      Display: '6.1 inch Super Retina XDR, 60Hz',
      Chip: 'A15 Bionic',
      'Main camera': '12MP main, 12MP ultra wide',
      'Front camera': '12MP TrueDepth',
      Battery: 'Up to 19 hours video playback',
      Connector: 'Lightning',
      'Water resistance': 'IP68, 6 metres for 30 minutes',
      Released: 'September 2021',
    },
    releaseYear: 2021,
    isFeatured: false,
    sortOrder: 50,
    variants: [
      used(128, 'Midnight', '#2E3038', 'excellent', 849_900, 1_349_900, 6, 90),
      used(128, 'Pink', '#F5DDE0', 'excellent', 849_900, 1_349_900, 3, 89),
      used(128, 'Midnight', '#2E3038', 'good', 779_900, 1_349_900, 7, 86),
      used(256, 'Blue', '#2F4F6F', 'good', 899_900, 1_549_900, 2, 85),
      used(128, 'Starlight', '#EDE6DD', 'fair', 699_900, 1_349_900, 5, 82),
    ],
  },

  /* ------------------------------ Mac ----------------------------- */
  {
    slug: 'macbook-air-m3',
    categorySlug: 'mac',
    name: 'MacBook Air M3, 13 inch',
    tagline: 'Silent, cool, and lasts all day',
    description:
      'The Air has no fan, which means it makes no noise at all, and the M3 is quick enough that most people will never find its limit. Battery life is genuinely all day rather than marketing all day.\n\nWe cycle count every laptop we sell and state the figure, because on a laptop the battery is the part that actually ages.',
    highlights: [
      'Apple M3, 8 core CPU and up to 10 core GPU',
      'No fan, so completely silent under normal use',
      'Up to 18 hours battery',
      'Two Thunderbolt ports and MagSafe charging',
    ],
    specs: {
      Display: '13.6 inch Liquid Retina, 500 nits',
      Chip: 'Apple M3',
      Memory: '8GB or 16GB unified',
      Ports: '2x Thunderbolt 3, MagSafe 3, 3.5mm',
      Battery: 'Up to 18 hours',
      Weight: '1.24 kg',
      Released: 'March 2024',
    },
    releaseYear: 2024,
    isFeatured: true,
    sortOrder: 10,
    variants: [
      sealed(256, 'Midnight', '#2E3038', 2_399_900, null, 2),
      used(256, 'Midnight', '#2E3038', 'pristine', 2_099_900, 2_399_900, 2, 98, 'Cycle count 14'),
      used(256, 'Starlight', '#EDE6DD', 'excellent', 1_949_900, 2_399_900, 3, 95, 'Cycle count 62'),
      used(512, 'Space Grey', '#6E6E73', 'excellent', 2_299_900, 2_849_900, 2, 94, 'Cycle count 88'),
      used(256, 'Silver', '#E3E4E6', 'good', 1_799_900, 2_399_900, 3, 90, 'Cycle count 154'),
    ],
  },
  {
    slug: 'macbook-pro-14',
    categorySlug: 'mac',
    name: 'MacBook Pro 14 inch, M3 Pro',
    tagline: 'For work that actually needs it',
    description:
      'If you edit video, compile code or run virtual machines, the Pro earns its price. If you do not, buy the Air and spend the difference on something else; we will tell you that in the shop too.\n\nThe 120Hz mini-LED display is the real upgrade over the Air, and it is hard to go back from once you have used it.',
    highlights: [
      'M3 Pro, 11 core CPU and 14 core GPU',
      '120Hz mini-LED display, far brighter than the Air',
      'HDMI, SD card and three Thunderbolt ports',
      'Up to 18 hours battery despite the power',
    ],
    specs: {
      Display: '14.2 inch Liquid Retina XDR, 120Hz, 1600 nits peak',
      Chip: 'Apple M3 Pro',
      Memory: '18GB unified',
      Ports: '3x Thunderbolt 4, HDMI, SDXC, MagSafe 3, 3.5mm',
      Battery: 'Up to 18 hours',
      Weight: '1.61 kg',
      Released: 'October 2023',
    },
    releaseYear: 2023,
    isFeatured: false,
    sortOrder: 20,
    variants: [
      used(512, 'Space Black', '#2A2A2C', 'pristine', 3_449_900, 3_999_900, 1, 97, 'Cycle count 31'),
      used(512, 'Silver', '#E3E4E6', 'excellent', 3_249_900, 3_999_900, 2, 94, 'Cycle count 107'),
      used(1024, 'Space Black', '#2A2A2C', 'excellent', 3_749_900, 4_599_900, 1, 93, 'Cycle count 76'),
      used(512, 'Silver', '#E3E4E6', 'good', 2_999_900, 3_999_900, 2, 89, 'Cycle count 221'),
    ],
  },

  /* ------------------------------ iPad ---------------------------- */
  {
    slug: 'ipad-air-m2',
    categorySlug: 'ipad',
    name: 'iPad Air M2, 11 inch',
    tagline: 'The one to buy if you are going to draw on it',
    description:
      'The Air takes the Apple Pencil Pro and has the laminated display, which is the difference that matters if you draw: on the cheaper iPad there is a visible gap between the pen tip and the line.\n\nEvery screen is checked for pressure marks and uniformity before it is listed.',
    highlights: [
      'Apple M2, the same chip family as the MacBook Air',
      'Laminated display, so the pen tip meets the line',
      'Works with Apple Pencil Pro',
      'USB-C and Touch ID in the top button',
    ],
    specs: {
      Display: '11 inch Liquid Retina, laminated, 500 nits',
      Chip: 'Apple M2',
      Camera: '12MP wide rear, 12MP centre stage front',
      Connector: 'USB-C',
      Pencil: 'Apple Pencil Pro and USB-C',
      Weight: '462 g',
      Released: 'May 2024',
    },
    releaseYear: 2024,
    isFeatured: true,
    sortOrder: 10,
    variants: [
      sealed(128, 'Space Grey', '#6E6E73', 1_399_900, null, 3),
      used(128, 'Space Grey', '#6E6E73', 'pristine', 1_229_900, 1_399_900, 2, 98),
      used(128, 'Blue', '#4E6E8E', 'excellent', 1_149_900, 1_399_900, 4, 95),
      used(256, 'Starlight', '#EDE6DD', 'excellent', 1_349_900, 1_649_900, 2, 94),
      used(128, 'Space Grey', '#6E6E73', 'good', 1_049_900, 1_399_900, 3, 90),
    ],
  },
  {
    slug: 'ipad-10th-gen',
    categorySlug: 'ipad',
    name: 'iPad, 10th generation',
    tagline: 'For watching, reading and the children',
    description:
      'The standard iPad does everything except the things artists care about. The display is not laminated, so there is a small gap under the glass, which you will never notice unless you are drawing.\n\nFor a child, a kitchen, or a seat-back on a long flight, it is more than enough and the sensible amount of money to spend.',
    highlights: [
      'A14 Bionic, quick enough for everything but heavy editing',
      '10.9 inch display with slim bezels',
      'USB-C and Touch ID',
      'Landscape front camera, which is the right place for video calls',
    ],
    specs: {
      Display: '10.9 inch Liquid Retina, not laminated, 500 nits',
      Chip: 'A14 Bionic',
      Camera: '12MP wide rear, 12MP landscape front',
      Connector: 'USB-C',
      Pencil: 'Apple Pencil USB-C and 1st generation',
      Weight: '477 g',
      Released: 'October 2022',
    },
    releaseYear: 2022,
    isFeatured: false,
    sortOrder: 20,
    variants: [
      used(64, 'Silver', '#E3E4E6', 'excellent', 749_900, 1_049_900, 5, 94),
      used(64, 'Blue', '#4E6E8E', 'excellent', 749_900, 1_049_900, 3, 93),
      used(256, 'Pink', '#F0C9C4', 'excellent', 949_900, 1_349_900, 2, 92),
      used(64, 'Silver', '#E3E4E6', 'good', 679_900, 1_049_900, 6, 89),
      used(64, 'Yellow', '#F2D27A', 'fair', 599_900, 1_049_900, 3, 85),
    ],
  },

  /* ----------------------------- Watch ---------------------------- */
  {
    slug: 'apple-watch-series-9',
    categorySlug: 'watch',
    name: 'Apple Watch Series 9',
    tagline: 'With a brand new band, always',
    description:
      'Every watch we sell ships with a new band, because nobody wants to wear a strap that has been on another wrist. The case is graded on the same scale as everything else, and the battery health is measured and stated.\n\nSeries 9 added the double tap gesture and a much brighter screen than the 8.',
    highlights: [
      'Up to 2000 nits, readable in direct sun',
      'Double tap gesture to answer without touching the screen',
      'Blood oxygen and ECG',
      'New band included, in the colour you choose',
    ],
    specs: {
      Case: '41mm or 45mm aluminium',
      Display: 'Always-on Retina, up to 2000 nits',
      Chip: 'S9 SiP',
      Battery: 'Up to 18 hours, 36 in low power',
      'Water resistance': '50 metres',
      Connectivity: 'GPS, or GPS and cellular',
      Released: 'September 2023',
    },
    releaseYear: 2023,
    isFeatured: true,
    sortOrder: 10,
    variants: [
      sealed(null, 'Midnight 45mm', '#2E3038', 899_900, null, 2),
      used(null, 'Midnight 45mm', '#2E3038', 'pristine', 779_900, 899_900, 3, 97),
      used(null, 'Starlight 41mm', '#EDE6DD', 'excellent', 679_900, 849_900, 4, 94),
      used(null, 'Silver 45mm', '#E3E4E6', 'excellent', 749_900, 899_900, 2, 93),
      used(null, 'Midnight 41mm', '#2E3038', 'good', 599_900, 849_900, 5, 89),
    ],
  },
  {
    slug: 'apple-watch-se',
    categorySlug: 'watch',
    name: 'Apple Watch SE',
    tagline: 'The watch bit, without the extras',
    description:
      'The SE does fitness tracking, notifications, fall detection and Apple Pay. It leaves out the always-on display, the blood oxygen sensor and the ECG.\n\nFor most people, and particularly for a first watch or for a child, that is the right set of compromises.',
    highlights: [
      'Fall detection and crash detection',
      'Fitness and sleep tracking',
      'No always-on display, which helps the battery',
      'New band included',
    ],
    specs: {
      Case: '40mm or 44mm aluminium',
      Display: 'Retina, not always-on, 1000 nits',
      Chip: 'S8 SiP',
      Battery: 'Up to 18 hours',
      'Water resistance': '50 metres',
      Connectivity: 'GPS, or GPS and cellular',
      Released: 'September 2022',
    },
    releaseYear: 2022,
    isFeatured: false,
    sortOrder: 20,
    variants: [
      used(null, 'Midnight 44mm', '#2E3038', 'excellent', 479_900, 629_900, 4, 94),
      used(null, 'Starlight 40mm', '#EDE6DD', 'excellent', 429_900, 579_900, 3, 93),
      used(null, 'Midnight 40mm', '#2E3038', 'good', 379_900, 579_900, 5, 89),
      used(null, 'Silver 44mm', '#E3E4E6', 'fair', 349_900, 629_900, 2, 84),
    ],
  },

  /* ----------------------------- Audio ---------------------------- */
  {
    slug: 'airpods-pro-2',
    categorySlug: 'audio',
    name: 'AirPods Pro, 2nd generation',
    tagline: 'Sanitised, with new tips fitted',
    description:
      'Used earphones are the thing people are most squeamish about, reasonably. Every pair is cleaned, sanitised and fitted with brand new silicone tips in all three sizes before it is listed.\n\nBattery life on both the buds and the case is measured and stated, because that is what actually degrades.',
    highlights: [
      'Active noise cancellation and Transparency mode',
      'New silicone tips in all three sizes',
      'Battery life measured and stated per pair',
      'USB-C charging case',
    ],
    specs: {
      Chip: 'H2',
      'Noise control': 'Active noise cancellation, Adaptive Transparency',
      Battery: 'Up to 6 hours, 30 with the case',
      Case: 'USB-C, MagSafe and Qi compatible',
      'Water resistance': 'IP54 buds and case',
      Released: 'September 2023',
    },
    releaseYear: 2023,
    isFeatured: true,
    sortOrder: 10,
    variants: [
      sealed(null, 'White', '#F5F5F7', 549_900, null, 4),
      used(null, 'White', '#F5F5F7', 'pristine', 469_900, 549_900, 3, 96, 'Case battery 97%'),
      used(null, 'White', '#F5F5F7', 'excellent', 429_900, 549_900, 6, 92, 'Case battery 91%'),
      used(null, 'White', '#F5F5F7', 'good', 379_900, 549_900, 4, 87, 'Case battery 85%, light marks on the case'),
    ],
  },

  /* -------------------------- Accessories ------------------------- */
  {
    slug: 'usb-c-charge-cable',
    categorySlug: 'accessories',
    name: 'USB-C charge cable, 2 metres',
    tagline: 'The one that does not fray at the plug',
    description:
      'Braided, two metres, and rated for 60W so it will charge a MacBook Air as well as a phone. We stock this one because the cheap ones fail at the plug within a year and we got tired of replacing them under warranty.',
    highlights: [
      'Braided sleeve, which is what stops the fraying',
      '60W rated, enough for a MacBook Air',
      'Two metres, so you can use the phone while it charges',
      '24 month warranty',
    ],
    specs: {
      Length: '2 metres',
      Rating: '60W power delivery',
      'Data speed': 'USB 2.0, 480Mbps',
      Warranty: '24 months',
    },
    releaseYear: 2024,
    isFeatured: false,
    sortOrder: 10,
    variants: [
      { storageGb: null, colourName: 'White', colourHex: '#F5F5F7', condition: 'new', priceCents: 34_900, compareAtCents: null, stockQuantity: 40, batteryHealthMin: null, warrantyMonths: 24 },
      { storageGb: null, colourName: 'Black', colourHex: '#2A2A2C', condition: 'new', priceCents: 34_900, compareAtCents: null, stockQuantity: 35, batteryHealthMin: null, warrantyMonths: 24 },
    ],
  },
  {
    slug: 'magsafe-charger',
    categorySlug: 'accessories',
    name: 'MagSafe wireless charger',
    tagline: 'Snaps on, charges at full speed',
    description:
      'A proper MagSafe charger rather than a generic Qi pad, so it charges at 15W instead of 7.5W and it actually stays put. Needs a 20W adapter, which we sell separately or will throw in on request.',
    highlights: [
      '15W on a compatible iPhone, double a standard Qi pad',
      'Magnetically aligned, so it cannot be put on wrong',
      'One metre captive cable',
      '24 month warranty',
    ],
    specs: {
      Output: '15W MagSafe, 7.5W Qi',
      Cable: '1 metre captive USB-C',
      Requires: '20W USB-C adapter, sold separately',
      Warranty: '24 months',
    },
    releaseYear: 2024,
    isFeatured: false,
    sortOrder: 20,
    variants: [
      { storageGb: null, colourName: 'White', colourHex: '#F5F5F7', condition: 'new', priceCents: 74_900, compareAtCents: 99_900, stockQuantity: 18, batteryHealthMin: null, warrantyMonths: 24 },
    ],
  },
  {
    slug: 'silicone-case',
    categorySlug: 'accessories',
    name: 'Silicone case with MagSafe',
    tagline: 'Because the back glass costs more than the case',
    description:
      'Soft touch silicone with a microfibre lining and an embedded magnet ring. Raised lip around the camera and the screen.\n\nWe sell these at close to cost with a device, because replacing a cracked back panel costs several thousand Rand and a case costs this.',
    highlights: [
      'MagSafe magnet ring built in',
      'Raised camera and screen lip',
      'Microfibre lining, so it does not scratch the back',
      'Available for the iPhone models we stock',
    ],
    specs: {
      Material: 'Silicone with microfibre lining',
      MagSafe: 'Yes, full magnet array',
      Fits: 'iPhone 13 through iPhone 16 Pro',
      Warranty: '12 months',
    },
    releaseYear: 2024,
    isFeatured: false,
    sortOrder: 30,
    variants: [
      { storageGb: null, colourName: 'Black', colourHex: '#2A2A2C', condition: 'new', priceCents: 44_900, compareAtCents: 79_900, stockQuantity: 25, batteryHealthMin: null, warrantyMonths: 12 },
      { storageGb: null, colourName: 'Storm Blue', colourHex: '#3C5A78', condition: 'new', priceCents: 44_900, compareAtCents: 79_900, stockQuantity: 14, batteryHealthMin: null, warrantyMonths: 12 },
      { storageGb: null, colourName: 'Clay', colourHex: '#C9A491', condition: 'new', priceCents: 44_900, compareAtCents: 79_900, stockQuantity: 11, batteryHealthMin: null, warrantyMonths: 12 },
    ],
  },
];

export { categoryImages };
