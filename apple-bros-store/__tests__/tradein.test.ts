import { describe, expect, it } from 'vitest';
import {
  BATTERY_REPLACEMENT_COST_CENTS,
  CONDITION_RATE,
  MINIMUM_VIABLE_CENTS,
  calculateTradeIn,
  quoteExpiryFrom,
} from '@/lib/tradein/calculator';

/** An iPhone-shaped model: R12 000 top value, three storage sizes. */
const model = {
  baseValueCents: 1_200_000,
  storageOptions: [128, 256, 512],
};

const flawlessTopSpec = {
  storageGb: 512,
  condition: 'flawless' as const,
  isUnlocked: true,
  powersOn: true,
  batteryHealth: 100,
};

describe('the best possible device', () => {
  it('is worth exactly the published base value', () => {
    const quote = calculateTradeIn(model, flawlessTopSpec);
    expect(quote.valueCents).toBe(model.baseValueCents);
    expect(quote.adjustments).toEqual([]);
    expect(quote.isAccepted).toBe(true);
  });

  it('shows no working when nothing was deducted', () => {
    // A quote with no adjustments is the simplest possible explanation, and
    // the page relies on an empty list to render "top value, nothing deducted".
    expect(calculateTradeIn(model, flawlessTopSpec).adjustments).toHaveLength(0);
  });
});

describe('condition', () => {
  it.each([
    ['flawless', 1],
    ['light_marks', CONDITION_RATE.light_marks],
    ['visible_wear', CONDITION_RATE.visible_wear],
    ['damaged', CONDITION_RATE.damaged],
  ] as const)('%s is worth the published rate', (condition, rate) => {
    const quote = calculateTradeIn(model, {
      ...flawlessTopSpec,
      condition,
    });
    expect(quote.valueCents).toBe(
      Math.round((model.baseValueCents * rate) / 100) * 100,
    );
  });

  it('values worse condition at strictly less', () => {
    const order = ['flawless', 'light_marks', 'visible_wear', 'damaged'] as const;
    const values = order.map(
      (condition) =>
        calculateTradeIn(model, { ...flawlessTopSpec, condition }).valueCents,
    );
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeLessThan(values[i - 1]!);
    }
  });
});

describe('storage', () => {
  it('pays the base value for the largest size', () => {
    expect(
      calculateTradeIn(model, { ...flawlessTopSpec, storageGb: 512 })
        .adjustments,
    ).toHaveLength(0);
  });

  it('steps the value down for each size below the largest', () => {
    const mid = calculateTradeIn(model, {
      ...flawlessTopSpec,
      storageGb: 256,
    });
    const low = calculateTradeIn(model, {
      ...flawlessTopSpec,
      storageGb: 128,
    });
    expect(mid.valueCents).toBeLessThan(model.baseValueCents);
    expect(low.valueCents).toBeLessThan(mid.valueCents);
    expect(mid.adjustments[0]!.label).toContain('256 GB');
  });

  it('treats an unrecognised size conservatively, as the smallest', () => {
    // Never over-quote on a guess: an unknown size is valued as the lowest.
    const unknown = calculateTradeIn(model, {
      ...flawlessTopSpec,
      storageGb: 64,
    });
    const smallest = calculateTradeIn(model, {
      ...flawlessTopSpec,
      storageGb: 128,
    });
    expect(unknown.valueCents).toBe(smallest.valueCents);
  });

  it('ignores storage for a model where it does not apply', () => {
    const watch = { baseValueCents: 300_000, storageOptions: [] };
    expect(
      calculateTradeIn(watch, { ...flawlessTopSpec, storageGb: null })
        .adjustments,
    ).toHaveLength(0);
  });
});

describe('carrier lock', () => {
  it('reduces the value and says so', () => {
    const quote = calculateTradeIn(model, {
      ...flawlessTopSpec,
      isUnlocked: false,
    });
    expect(quote.valueCents).toBeLessThan(model.baseValueCents);
    expect(quote.adjustments.some((a) => a.label.includes('Locked'))).toBe(true);
  });
});

describe('battery', () => {
  it('deducts nothing at or above the threshold', () => {
    expect(
      calculateTradeIn(model, { ...flawlessTopSpec, batteryHealth: 80 })
        .adjustments,
    ).toHaveLength(0);
    expect(
      calculateTradeIn(model, { ...flawlessTopSpec, batteryHealth: 100 })
        .adjustments,
    ).toHaveLength(0);
  });

  it('deducts the replacement cost below the threshold', () => {
    const quote = calculateTradeIn(model, {
      ...flawlessTopSpec,
      batteryHealth: 72,
    });
    expect(quote.valueCents).toBe(
      model.baseValueCents - BATTERY_REPLACEMENT_COST_CENTS,
    );
    expect(quote.adjustments[0]!.label).toContain('72%');
  });

  it('deducts a flat cost, not a proportion', () => {
    // Replacing a battery costs the same whatever the handset is worth, so a
    // cheap device must not get a smaller deduction than an expensive one.
    const cheap = { baseValueCents: 400_000, storageOptions: [128] };
    const quoteCheap = calculateTradeIn(cheap, {
      ...flawlessTopSpec,
      storageGb: 128,
      batteryHealth: 70,
    });
    const quoteDear = calculateTradeIn(model, {
      ...flawlessTopSpec,
      batteryHealth: 70,
    });
    const cheapDeduction = Math.abs(quoteCheap.adjustments.at(-1)!.deltaCents);
    const dearDeduction = Math.abs(quoteDear.adjustments.at(-1)!.deltaCents);
    expect(cheapDeduction).toBe(dearDeduction);
  });

  it('never deducts more than the device is worth', () => {
    const nearlyWorthless = { baseValueCents: 60_000, storageOptions: [] };
    const quote = calculateTradeIn(nearlyWorthless, {
      ...flawlessTopSpec,
      storageGb: null,
      batteryHealth: 50,
    });
    expect(quote.valueCents).toBeGreaterThanOrEqual(0);
  });

  it('ignores an unknown battery health rather than assuming the worst', () => {
    expect(
      calculateTradeIn(model, { ...flawlessTopSpec, batteryHealth: null })
        .adjustments,
    ).toHaveLength(0);
  });
});

describe('a device that does not power on', () => {
  it('is valued for parts and nothing else is applied', () => {
    const quote = calculateTradeIn(model, {
      ...flawlessTopSpec,
      powersOn: false,
    });
    expect(quote.adjustments).toHaveLength(1);
    expect(quote.adjustments[0]!.label).toContain('parts');
  });

  it('ignores condition entirely, because a dead flawless device is still dead', () => {
    const flawless = calculateTradeIn(model, {
      ...flawlessTopSpec,
      powersOn: false,
      condition: 'flawless',
    });
    const damaged = calculateTradeIn(model, {
      ...flawlessTopSpec,
      powersOn: false,
      condition: 'damaged',
    });
    expect(flawless.valueCents).toBe(damaged.valueCents);
  });
});

describe('declining a device', () => {
  it('declines rather than quoting below what processing costs', () => {
    const scrap = { baseValueCents: 30_000, storageOptions: [] };
    const quote = calculateTradeIn(scrap, {
      ...flawlessTopSpec,
      storageGb: null,
      condition: 'damaged',
    });
    expect(quote.isAccepted).toBe(false);
    expect(quote.valueCents).toBe(0);
    expect(quote.declineReason).toBeTruthy();
  });

  it('offers free recycling rather than just saying no', () => {
    const scrap = { baseValueCents: 20_000, storageOptions: [] };
    const quote = calculateTradeIn(scrap, {
      ...flawlessTopSpec,
      storageGb: null,
      condition: 'damaged',
    });
    expect(quote.declineReason).toContain('recycle');
  });

  it('accepts anything at or above the viable minimum', () => {
    const borderline = {
      baseValueCents: MINIMUM_VIABLE_CENTS,
      storageOptions: [],
    };
    const quote = calculateTradeIn(borderline, {
      ...flawlessTopSpec,
      storageGb: null,
    });
    expect(quote.valueCents).toBe(MINIMUM_VIABLE_CENTS);
    expect(quote.isAccepted).toBe(true);
  });
});

describe('the quote as a whole', () => {
  it('is deterministic', () => {
    const answers = {
      storageGb: 256,
      condition: 'light_marks' as const,
      isUnlocked: false,
      powersOn: true,
      batteryHealth: 78,
    };
    expect(calculateTradeIn(model, answers)).toEqual(
      calculateTradeIn(model, answers),
    );
  });

  it('always lands on a whole Rand amount', () => {
    // Nobody should be offered R2 847,33 for a second hand phone.
    for (const condition of ['flawless', 'light_marks', 'visible_wear', 'damaged'] as const) {
      for (const storageGb of [128, 256, 512]) {
        const quote = calculateTradeIn(model, {
          ...flawlessTopSpec,
          condition,
          storageGb,
          isUnlocked: false,
        });
        expect(quote.valueCents % 100).toBe(0);
      }
    }
  });

  it('never returns a negative value', () => {
    const quote = calculateTradeIn(
      { baseValueCents: 25_000, storageOptions: [] },
      {
        storageGb: null,
        condition: 'damaged',
        isUnlocked: false,
        powersOn: true,
        batteryHealth: 40,
      },
    );
    expect(quote.valueCents).toBeGreaterThanOrEqual(0);
  });

  it('shows its working, so the customer can check the arithmetic', () => {
    const quote = calculateTradeIn(model, {
      storageGb: 128,
      condition: 'visible_wear',
      isUnlocked: false,
      powersOn: true,
      batteryHealth: 65,
    });
    expect(quote.adjustments.length).toBe(4);
    // Base plus every adjustment must equal the quoted figure, otherwise the
    // breakdown shown to the customer would not add up.
    const summed = quote.adjustments.reduce(
      (total, a) => total + a.deltaCents,
      quote.baseCents,
    );
    expect(summed).toBe(quote.valueCents);
  });
});

describe('quote expiry', () => {
  it('stands for a fortnight, because the market moves', () => {
    const now = new Date('2026-10-06T10:00:00Z');
    const expiry = quoteExpiryFrom(now);
    const days = Math.round(
      (expiry.getTime() - now.getTime()) / 86_400_000,
    );
    expect(days).toBe(14);
  });
});
