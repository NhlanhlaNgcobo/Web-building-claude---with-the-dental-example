import type { ProductFamily } from '@/lib/domain/enums';

/**
 * The published trade in price list.
 *
 * Each baseValueCents is the most we pay for that model: a flawless, unlocked
 * unit at the largest storage size, with healthy battery. Every other outcome
 * is a deduction from it under the rules in lib/tradein/calculator.ts, and
 * both the base and the deductions are shown to the customer.
 *
 * These are seeded into the database rather than read from here at runtime,
 * because the shop needs to move them as the market moves without waiting for
 * a deployment.
 *
 * Sanity check when editing: the trade in value should sit well below what we
 * sell the same model for, because between the two sits testing, any repairs,
 * a new battery, a warranty we honour, and the shop staying open.
 */

export interface TradeInModelSeed {
  readonly slug: string;
  readonly family: ProductFamily;
  readonly label: string;
  readonly storageOptions: readonly number[];
  readonly baseValueCents: number;
  readonly releaseYear: number;
  readonly sortOrder: number;
}

export const tradeInModelSeeds: readonly TradeInModelSeed[] = [
  /* ------------------------------ iPhone ------------------------------ */
  { slug: 'iphone-16-pro-max', family: 'iphone', label: 'iPhone 16 Pro Max', storageOptions: [256, 512, 1024], baseValueCents: 1_690_000, releaseYear: 2024, sortOrder: 10 },
  { slug: 'iphone-16-pro', family: 'iphone', label: 'iPhone 16 Pro', storageOptions: [128, 256, 512, 1024], baseValueCents: 1_520_000, releaseYear: 2024, sortOrder: 20 },
  { slug: 'iphone-16-plus', family: 'iphone', label: 'iPhone 16 Plus', storageOptions: [128, 256, 512], baseValueCents: 1_180_000, releaseYear: 2024, sortOrder: 30 },
  { slug: 'iphone-16', family: 'iphone', label: 'iPhone 16', storageOptions: [128, 256, 512], baseValueCents: 1_050_000, releaseYear: 2024, sortOrder: 40 },
  { slug: 'iphone-15-pro-max', family: 'iphone', label: 'iPhone 15 Pro Max', storageOptions: [256, 512, 1024], baseValueCents: 1_250_000, releaseYear: 2023, sortOrder: 50 },
  { slug: 'iphone-15-pro', family: 'iphone', label: 'iPhone 15 Pro', storageOptions: [128, 256, 512, 1024], baseValueCents: 1_100_000, releaseYear: 2023, sortOrder: 60 },
  { slug: 'iphone-15', family: 'iphone', label: 'iPhone 15', storageOptions: [128, 256, 512], baseValueCents: 820_000, releaseYear: 2023, sortOrder: 70 },
  { slug: 'iphone-14-pro', family: 'iphone', label: 'iPhone 14 Pro', storageOptions: [128, 256, 512, 1024], baseValueCents: 850_000, releaseYear: 2022, sortOrder: 80 },
  { slug: 'iphone-14', family: 'iphone', label: 'iPhone 14', storageOptions: [128, 256, 512], baseValueCents: 650_000, releaseYear: 2022, sortOrder: 90 },
  { slug: 'iphone-13-pro', family: 'iphone', label: 'iPhone 13 Pro', storageOptions: [128, 256, 512, 1024], baseValueCents: 620_000, releaseYear: 2021, sortOrder: 100 },
  { slug: 'iphone-13', family: 'iphone', label: 'iPhone 13', storageOptions: [128, 256, 512], baseValueCents: 450_000, releaseYear: 2021, sortOrder: 110 },
  { slug: 'iphone-12', family: 'iphone', label: 'iPhone 12', storageOptions: [64, 128, 256], baseValueCents: 300_000, releaseYear: 2020, sortOrder: 120 },
  { slug: 'iphone-11', family: 'iphone', label: 'iPhone 11', storageOptions: [64, 128, 256], baseValueCents: 220_000, releaseYear: 2019, sortOrder: 130 },
  { slug: 'iphone-se-3', family: 'iphone', label: 'iPhone SE, 3rd generation', storageOptions: [64, 128, 256], baseValueCents: 180_000, releaseYear: 2022, sortOrder: 140 },

  /* -------------------------------- Mac ------------------------------- */
  { slug: 'macbook-air-m3', family: 'mac', label: 'MacBook Air M3', storageOptions: [256, 512, 1024], baseValueCents: 1_350_000, releaseYear: 2024, sortOrder: 10 },
  { slug: 'macbook-air-m2', family: 'mac', label: 'MacBook Air M2', storageOptions: [256, 512, 1024], baseValueCents: 950_000, releaseYear: 2022, sortOrder: 20 },
  { slug: 'macbook-air-m1', family: 'mac', label: 'MacBook Air M1', storageOptions: [256, 512], baseValueCents: 620_000, releaseYear: 2020, sortOrder: 30 },
  { slug: 'macbook-pro-14-m3', family: 'mac', label: 'MacBook Pro 14, M3', storageOptions: [512, 1024], baseValueCents: 2_150_000, releaseYear: 2023, sortOrder: 40 },
  { slug: 'macbook-pro-13-m2', family: 'mac', label: 'MacBook Pro 13, M2', storageOptions: [256, 512], baseValueCents: 980_000, releaseYear: 2022, sortOrder: 50 },

  /* ------------------------------- iPad ------------------------------- */
  { slug: 'ipad-pro-11-m4', family: 'ipad', label: 'iPad Pro 11, M4', storageOptions: [256, 512, 1024], baseValueCents: 1_250_000, releaseYear: 2024, sortOrder: 10 },
  { slug: 'ipad-air-m2', family: 'ipad', label: 'iPad Air M2', storageOptions: [128, 256, 512], baseValueCents: 720_000, releaseYear: 2024, sortOrder: 20 },
  { slug: 'ipad-air-m1', family: 'ipad', label: 'iPad Air M1', storageOptions: [64, 256], baseValueCents: 450_000, releaseYear: 2022, sortOrder: 30 },
  { slug: 'ipad-10', family: 'ipad', label: 'iPad, 10th generation', storageOptions: [64, 256], baseValueCents: 380_000, releaseYear: 2022, sortOrder: 40 },
  { slug: 'ipad-9', family: 'ipad', label: 'iPad, 9th generation', storageOptions: [64, 256], baseValueCents: 240_000, releaseYear: 2021, sortOrder: 50 },

  /* ------------------------------- Watch ------------------------------ */
  { slug: 'apple-watch-s10', family: 'watch', label: 'Apple Watch Series 10', storageOptions: [], baseValueCents: 520_000, releaseYear: 2024, sortOrder: 10 },
  { slug: 'apple-watch-s9', family: 'watch', label: 'Apple Watch Series 9', storageOptions: [], baseValueCents: 400_000, releaseYear: 2023, sortOrder: 20 },
  { slug: 'apple-watch-ultra-2', family: 'watch', label: 'Apple Watch Ultra 2', storageOptions: [], baseValueCents: 920_000, releaseYear: 2023, sortOrder: 30 },
  { slug: 'apple-watch-se-2', family: 'watch', label: 'Apple Watch SE, 2nd generation', storageOptions: [], baseValueCents: 230_000, releaseYear: 2022, sortOrder: 40 },
  { slug: 'apple-watch-s8', family: 'watch', label: 'Apple Watch Series 8', storageOptions: [], baseValueCents: 260_000, releaseYear: 2022, sortOrder: 50 },

  /* ------------------------------- Audio ------------------------------ */
  { slug: 'airpods-pro-2', family: 'audio', label: 'AirPods Pro, 2nd generation', storageOptions: [], baseValueCents: 230_000, releaseYear: 2023, sortOrder: 10 },
  { slug: 'airpods-4', family: 'audio', label: 'AirPods 4', storageOptions: [], baseValueCents: 150_000, releaseYear: 2024, sortOrder: 20 },
  { slug: 'airpods-max', family: 'audio', label: 'AirPods Max', storageOptions: [], baseValueCents: 640_000, releaseYear: 2020, sortOrder: 30 },
];

/**
 * What we cannot buy, and why.
 *
 * Saying so up front saves somebody packing a device and posting it to us.
 * The activation lock point in particular is not negotiable: a locked device
 * cannot be wiped or resold, and in most cases it means it is not the
 * seller's to sell.
 */
export const tradeInExclusions = [
  {
    title: 'Devices still signed in to an Apple Account',
    detail:
      'We cannot buy a device with activation lock still on it. It cannot be wiped or resold, and more often than not it means the device is not the seller to sell. Sign out of Find My and erase it before bringing it in.',
  },
  {
    title: 'Devices reported lost or stolen',
    detail:
      'Every device is checked against the stolen property register. If it comes back flagged we are obliged to hold it and report it, so please do not bring one in.',
  },
  {
    title: 'Devices with a swollen battery',
    detail:
      'A swollen battery is a fire risk and cannot be transported safely. Bring it to the shop in person and we will dispose of it properly at no charge.',
  },
  {
    title: 'Android phones and non-Apple laptops',
    detail:
      'We only know Apple, so we only buy Apple. Quoting on something we cannot grade properly would not be fair to anyone.',
  },
] as const;
