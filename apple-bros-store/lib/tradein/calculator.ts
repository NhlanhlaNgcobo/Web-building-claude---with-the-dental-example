import type { TradeInCondition } from '@/lib/domain/enums';

/**
 * Trade in valuation. A pure function, no I/O, no Prisma import.
 *
 * The rules are deliberately simple, published on the trade in page, and
 * applied in a fixed order so the same answers always produce the same
 * number. A customer can work out their own quote from the page, and when
 * the figure is revised after inspection the shop can point at exactly which
 * rule changed.
 *
 * The alternative, an opaque number that moves, is how trade in gets its
 * reputation for being a haggle.
 */

export interface TradeInAnswers {
  /** Null where storage does not affect this model's value. */
  readonly storageGb: number | null;
  readonly condition: TradeInCondition;
  readonly isUnlocked: boolean;
  readonly powersOn: boolean;
  /** Reported battery health percentage, where the customer knows it. */
  readonly batteryHealth: number | null;
}

export interface TradeInModelValue {
  /** The most paid for this model: flawless, unlocked, largest storage. */
  readonly baseValueCents: number;
  /** Storage sizes this model shipped in, ascending. Empty where N/A. */
  readonly storageOptions: readonly number[];
}

/** One applied rule, so the quote can show its own working. */
export interface TradeInAdjustment {
  readonly label: string;
  readonly deltaCents: number;
}

export interface TradeInQuote {
  readonly baseCents: number;
  readonly adjustments: readonly TradeInAdjustment[];
  readonly valueCents: number;
  /** False when the device is worth less than it costs to process. */
  readonly isAccepted: boolean;
  readonly declineReason: string | null;
}

/* ------------------------------------------------------------------ */
/* Published rates                                                     */
/* ------------------------------------------------------------------ */

/**
 * What each reported condition is worth, as a proportion of the base value.
 *
 * Blunt on purpose. A customer cannot reliably grade their own device, so
 * asking them to choose between five near-identical options produces a quote
 * that has to be revised on arrival, which is the worst outcome for everyone.
 */
export const CONDITION_RATE: Record<TradeInCondition, number> = {
  flawless: 1,
  light_marks: 0.85,
  visible_wear: 0.68,
  damaged: 0.35,
};

/** A locked device sells for less, because its market is smaller. */
export const LOCKED_RATE = 0.85;

/**
 * A device that does not power on is bought for parts only, as a flat
 * proportion of base. Condition is irrelevant at that point: a flawless
 * handset that will not switch on is still only worth its components.
 */
export const DEAD_DEVICE_RATE = 0.12;

/** Below this battery health the device needs a new battery before resale. */
export const BATTERY_HEALTH_THRESHOLD = 80;
export const BATTERY_REPLACEMENT_COST_CENTS = 85_000;

/**
 * Each storage step below the largest size reduces the value. Applied per
 * step rather than per gigabyte, because that is how the resale market
 * actually prices it.
 */
export const STORAGE_STEP_RATE = 0.92;

/**
 * Below this, processing, testing and data wiping costs more than the device
 * is worth. Quoting R40 for a handset is not a service to anybody, so it is
 * declined with a reason instead.
 */
export const MINIMUM_VIABLE_CENTS = 20_000;

/* ------------------------------------------------------------------ */
/* Calculation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Value a device.
 *
 * Rules apply in a fixed order, each recorded as an adjustment so the quote
 * can show its working:
 *
 *   1. Storage, stepped down from the largest size.
 *   2. Condition.
 *   3. Carrier lock.
 *   4. Battery, where it is below the threshold and would need replacing.
 *
 * A device that does not power on short circuits all of that and is valued
 * for parts.
 */
export function calculateTradeIn(
  model: TradeInModelValue,
  answers: TradeInAnswers,
): TradeInQuote {
  const base = model.baseValueCents;
  const adjustments: TradeInAdjustment[] = [];

  /* ---- Does not power on: parts value, nothing else applies ---- */
  if (!answers.powersOn) {
    const value = roundToRand(base * DEAD_DEVICE_RATE);
    const accepted = value >= MINIMUM_VIABLE_CENTS;
    return {
      baseCents: base,
      adjustments: [
        {
          label: 'Device does not power on, valued for parts',
          deltaCents: value - base,
        },
      ],
      valueCents: accepted ? value : 0,
      isAccepted: accepted,
      declineReason: accepted
        ? null
        : 'A device that does not power on is only worth its parts, and this model is below what it costs us to process one safely.',
    };
  }

  let running = base;

  /* ---- 1. Storage ---- */
  if (answers.storageGb !== null && model.storageOptions.length > 1) {
    const sorted = [...model.storageOptions].sort((a, b) => a - b);
    const index = sorted.indexOf(answers.storageGb);
    // An unrecognised size is treated as the smallest, which is the
    // conservative direction: we never over-quote on a guess.
    const stepsBelowTop =
      index === -1 ? sorted.length - 1 : sorted.length - 1 - index;

    if (stepsBelowTop > 0) {
      const after = running * STORAGE_STEP_RATE ** stepsBelowTop;
      adjustments.push({
        label: `${answers.storageGb} GB rather than ${sorted[sorted.length - 1]} GB`,
        deltaCents: roundToRand(after) - roundToRand(running),
      });
      running = after;
    }
  }

  /* ---- 2. Condition ---- */
  const conditionRate = CONDITION_RATE[answers.condition];
  if (conditionRate < 1) {
    const after = running * conditionRate;
    adjustments.push({
      label: conditionLabel(answers.condition),
      deltaCents: roundToRand(after) - roundToRand(running),
    });
    running = after;
  }

  /* ---- 3. Carrier lock ---- */
  if (!answers.isUnlocked) {
    const after = running * LOCKED_RATE;
    adjustments.push({
      label: 'Locked to a network',
      deltaCents: roundToRand(after) - roundToRand(running),
    });
    running = after;
  }

  /* ---- 4. Battery ----
     A flat deduction rather than a proportion, because replacing a battery
     costs what it costs regardless of what the handset is worth. */
  if (
    answers.batteryHealth !== null &&
    answers.batteryHealth < BATTERY_HEALTH_THRESHOLD
  ) {
    const deduction = Math.min(
      BATTERY_REPLACEMENT_COST_CENTS,
      roundToRand(running),
    );
    adjustments.push({
      label: `Battery health ${answers.batteryHealth}%, needs replacing`,
      deltaCents: -deduction,
    });
    running = roundToRand(running) - deduction;
  }

  const value = Math.max(roundToRand(running), 0);
  const accepted = value >= MINIMUM_VIABLE_CENTS;

  return {
    baseCents: base,
    adjustments,
    valueCents: accepted ? value : 0,
    isAccepted: accepted,
    declineReason: accepted
      ? null
      : 'This device is worth less than it costs us to test, wipe and process, so we cannot make an offer on it. We will still recycle it for you at no charge.',
  };
}

function conditionLabel(condition: TradeInCondition): string {
  switch (condition) {
    case 'flawless':
      return 'Like new';
    case 'light_marks':
      return 'Light scratches';
    case 'visible_wear':
      return 'Obvious wear';
    case 'damaged':
      return 'Cracked or damaged';
  }
}

/**
 * Round to whole Rand.
 *
 * Trade in offers are always whole Rand: quoting R2 847,33 for a second hand
 * phone invites a conversation about the 33 cents that helps nobody.
 */
function roundToRand(cents: number): number {
  return Math.round(cents / 100) * 100;
}

/** How long a quote stands before the market has moved under it. */
export const QUOTE_VALID_DAYS = 14;

export function quoteExpiryFrom(now: Date = new Date()): Date {
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + QUOTE_VALID_DAYS);
  return expiry;
}
