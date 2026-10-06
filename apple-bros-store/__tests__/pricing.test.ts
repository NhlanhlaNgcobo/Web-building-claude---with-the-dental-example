import { describe, expect, it } from 'vitest';
import {
  VAT_PERCENT,
  availableOptions,
  bestSaving,
  buyableVariants,
  defaultVariant,
  findVariant,
  fromPriceCents,
  savingFor,
  sortVariantsForDisplay,
  toPriceCents,
  vatBreakdown,
  type PricedVariant,
} from '@/lib/catalogue/pricing';

function variant(
  id: string,
  overrides: Partial<PricedVariant> = {},
): PricedVariant {
  return {
    id,
    condition: 'excellent',
    storageGb: 256,
    colourName: 'Black Titanium',
    priceCents: 1_500_000,
    compareAtCents: null,
    stockQuantity: 5,
    isActive: true,
    ...overrides,
  };
}

describe('the from price', () => {
  it('is the cheapest variant a customer can actually buy', () => {
    expect(
      fromPriceCents([
        variant('a', { priceCents: 1_800_000 }),
        variant('b', { priceCents: 1_200_000 }),
        variant('c', { priceCents: 1_500_000 }),
      ]),
    ).toBe(1_200_000);
  });

  it('ignores a cheaper variant that is out of stock', () => {
    // Advertising a price nobody can buy is the thing that makes a shopper
    // stop trusting the whole catalogue.
    expect(
      fromPriceCents([
        variant('cheap-but-gone', { priceCents: 900_000, stockQuantity: 0 }),
        variant('available', { priceCents: 1_500_000 }),
      ]),
    ).toBe(1_500_000);
  });

  it('ignores a cheaper variant that has been withdrawn', () => {
    expect(
      fromPriceCents([
        variant('withdrawn', { priceCents: 900_000, isActive: false }),
        variant('available', { priceCents: 1_500_000 }),
      ]),
    ).toBe(1_500_000);
  });

  it('is null when nothing is buyable, so the card shows out of stock', () => {
    expect(
      fromPriceCents([
        variant('a', { stockQuantity: 0 }),
        variant('b', { isActive: false }),
      ]),
    ).toBeNull();
    expect(fromPriceCents([])).toBeNull();
  });

  it('gives a range with the highest buyable price', () => {
    const variants = [
      variant('a', { priceCents: 1_200_000 }),
      variant('b', { priceCents: 1_800_000 }),
      variant('gone', { priceCents: 2_400_000, stockQuantity: 0 }),
    ];
    expect(fromPriceCents(variants)).toBe(1_200_000);
    expect(toPriceCents(variants)).toBe(1_800_000);
  });
});

describe('savings', () => {
  it('reports a genuine saving with the right percentage', () => {
    expect(
      savingFor({ priceCents: 1_500_000, compareAtCents: 2_000_000 }),
    ).toEqual({ amountCents: 500_000, percent: 25 });
  });

  it('claims nothing when there is no comparison price', () => {
    expect(
      savingFor({ priceCents: 1_500_000, compareAtCents: null }),
    ).toBeNull();
  });

  it('refuses to invent a saving from a lower comparison price', () => {
    expect(
      savingFor({ priceCents: 1_500_000, compareAtCents: 1_400_000 }),
    ).toBeNull();
    expect(
      savingFor({ priceCents: 1_500_000, compareAtCents: 1_500_000 }),
    ).toBeNull();
  });

  it('ignores a saving too small to be worth a badge', () => {
    // Rounding 0.4% up to "1% off" to have something to show is exactly the
    // kind of thing that makes a page feel untrustworthy.
    expect(
      savingFor({ priceCents: 1_000_000, compareAtCents: 1_004_000 }),
    ).toBeNull();
  });

  it('picks the best genuine saving across buyable variants', () => {
    const saving = bestSaving([
      variant('a', { priceCents: 1_800_000, compareAtCents: 2_000_000 }),
      variant('b', { priceCents: 1_000_000, compareAtCents: 2_000_000 }),
    ]);
    expect(saving?.percent).toBe(50);
  });

  it('ignores a big saving on something out of stock', () => {
    expect(
      bestSaving([
        variant('gone', {
          priceCents: 500_000,
          compareAtCents: 2_000_000,
          stockQuantity: 0,
        }),
        variant('here', { priceCents: 1_800_000, compareAtCents: 2_000_000 }),
      ])?.percent,
    ).toBe(10);
  });
});

describe('VAT', () => {
  it('splits an inclusive amount without losing a cent', () => {
    for (const amount of [1_500_000, 999, 123_456, 1, 0]) {
      const { exclusiveCents, vatCents, inclusiveCents } = vatBreakdown(amount);
      expect(exclusiveCents + vatCents).toBe(inclusiveCents);
      expect(inclusiveCents).toBe(amount);
    }
  });

  it('derives roughly the right proportion', () => {
    const { exclusiveCents, vatCents } = vatBreakdown(1_150_000);
    expect(exclusiveCents).toBe(1_000_000);
    expect(vatCents).toBe(150_000);
    expect(VAT_PERCENT).toBe(15);
  });
});

describe('variant ordering and defaults', () => {
  it('sorts best condition first, then largest storage', () => {
    const sorted = sortVariantsForDisplay([
      variant('good-256', { condition: 'good', storageGb: 256 }),
      variant('new-128', { condition: 'new', storageGb: 128 }),
      variant('new-512', { condition: 'new', storageGb: 512 }),
      variant('excellent-256', { condition: 'excellent', storageGb: 256 }),
    ]);
    expect(sorted.map((v) => v.id)).toEqual([
      'new-512',
      'new-128',
      'excellent-256',
      'good-256',
    ]);
  });

  it('opens on the cheapest buyable variant, matching the advertised price', () => {
    const variants = [
      variant('dear', { priceCents: 2_000_000 }),
      variant('cheap', { priceCents: 1_100_000 }),
    ];
    expect(defaultVariant(variants)?.id).toBe('cheap');
    expect(defaultVariant(variants)?.priceCents).toBe(fromPriceCents(variants));
  });

  it('still shows something when the whole product is out of stock', () => {
    // The page must render specifications and a notify option rather than
    // collapsing to nothing.
    const sold = [
      variant('a', { stockQuantity: 0, condition: 'good' }),
      variant('b', { stockQuantity: 0, condition: 'new' }),
    ];
    expect(defaultVariant(sold)?.id).toBe('b');
  });

  it('is null only when there are no variants at all', () => {
    expect(defaultVariant([])).toBeNull();
  });

  it('is deterministic when two variants tie on price', () => {
    const tied = [
      variant('bbb', { priceCents: 1_000_000 }),
      variant('aaa', { priceCents: 1_000_000 }),
    ];
    expect(defaultVariant(tied)?.id).toBe('aaa');
    expect(defaultVariant([...tied].reverse())?.id).toBe('aaa');
  });
});

describe('finding an exact variant', () => {
  const variants = [
    variant('a', { storageGb: 256, colourName: 'Black', condition: 'new' }),
    variant('b', { storageGb: 512, colourName: 'Black', condition: 'good' }),
  ];

  it('matches on all three dimensions', () => {
    expect(
      findVariant(variants, {
        storageGb: 512,
        colourName: 'Black',
        condition: 'good',
      })?.id,
    ).toBe('b');
  });

  it('returns null rather than a near match', () => {
    // Silently substituting a different configuration is how somebody
    // receives the wrong device.
    expect(
      findVariant(variants, {
        storageGb: 512,
        colourName: 'Black',
        condition: 'new',
      }),
    ).toBeNull();
  });
});

describe('which options remain selectable', () => {
  const variants = [
    variant('a', { storageGb: 128, colourName: 'Black', condition: 'new' }),
    variant('b', { storageGb: 256, colourName: 'Black', condition: 'good' }),
    variant('c', { storageGb: 256, colourName: 'Blue', condition: 'good' }),
    variant('d', { storageGb: 512, colourName: 'Blue', condition: 'new', stockQuantity: 0 }),
  ];

  it('lists every option when nothing is selected', () => {
    const options = availableOptions(variants, {});
    expect(options.storage).toEqual([128, 256]);
    expect(options.colours).toEqual(['Black', 'Blue']);
    expect(options.conditions).toEqual(['new', 'good']);
  });

  it('narrows colours to those that exist in the chosen storage', () => {
    expect(availableOptions(variants, { storageGb: 128 }).colours).toEqual([
      'Black',
    ]);
    expect(availableOptions(variants, { storageGb: 256 }).colours).toEqual([
      'Black',
      'Blue',
    ]);
  });

  it('does not narrow a dimension by itself', () => {
    // Filtering storage by the chosen storage would always return just that
    // one size, making every other size look unavailable.
    expect(availableOptions(variants, { storageGb: 128 }).storage).toEqual([
      128, 256,
    ]);
  });

  it('excludes options that only exist out of stock', () => {
    // 512 GB exists in the catalogue but only as a sold-out variant, so it
    // must not be offered as a choice.
    expect(availableOptions(variants, {}).storage).not.toContain(512);
  });

  it('returns conditions in best-first order', () => {
    expect(availableOptions(variants, { colourName: 'Black' }).conditions).toEqual(
      ['new', 'good'],
    );
  });
});

describe('buyability', () => {
  it('requires both stock and an active variant', () => {
    expect(
      buyableVariants([
        variant('ok'),
        variant('no-stock', { stockQuantity: 0 }),
        variant('inactive', { isActive: false }),
        variant('both', { stockQuantity: 0, isActive: false }),
      ]).map((v) => v.id),
    ).toEqual(['ok']);
  });
});
