import { describe, expect, it } from 'vitest';
import {
  canFulfil,
  findShortfalls,
  stockLabel,
  stockState,
  trimToAvailable,
} from '@/lib/orders/stock';

const levels = [
  { variantId: 'in-stock', stockQuantity: 10, isActive: true },
  { variantId: 'low', stockQuantity: 2, isActive: true },
  { variantId: 'last', stockQuantity: 1, isActive: true },
  { variantId: 'out', stockQuantity: 0, isActive: true },
  { variantId: 'withdrawn', stockQuantity: 5, isActive: false },
];

describe('shortfalls', () => {
  it('finds none when everything is available', () => {
    expect(
      findShortfalls(
        [
          { variantId: 'in-stock', quantity: 3 },
          { variantId: 'low', quantity: 2 },
        ],
        levels,
      ),
    ).toEqual([]);
    expect(canFulfil([{ variantId: 'last', quantity: 1 }], levels)).toBe(true);
  });

  it('reports every shortfall rather than only the first', () => {
    const shortfalls = findShortfalls(
      [
        { variantId: 'in-stock', quantity: 1 },
        { variantId: 'low', quantity: 5 },
        { variantId: 'out', quantity: 1 },
        { variantId: 'withdrawn', quantity: 1 },
      ],
      levels,
    );
    expect(shortfalls).toHaveLength(3);
    expect(shortfalls.map((s) => s.variantId)).toEqual([
      'low',
      'out',
      'withdrawn',
    ]);
  });

  it('distinguishes insufficient stock from being unavailable', () => {
    const [insufficient] = findShortfalls(
      [{ variantId: 'low', quantity: 5 }],
      levels,
    );
    expect(insufficient).toEqual({
      variantId: 'low',
      requested: 5,
      available: 2,
      reason: 'insufficient',
    });

    const [gone] = findShortfalls([{ variantId: 'out', quantity: 1 }], levels);
    expect(gone!.reason).toBe('unavailable');
  });

  it('treats a deactivated variant as unavailable, whatever its count', () => {
    const [withdrawn] = findShortfalls(
      [{ variantId: 'withdrawn', quantity: 1 }],
      levels,
    );
    expect(withdrawn!.reason).toBe('unavailable');
    expect(withdrawn!.available).toBe(0);
  });

  it('treats a variant missing from the levels as unavailable', () => {
    const [missing] = findShortfalls(
      [{ variantId: 'never-existed', quantity: 1 }],
      levels,
    );
    expect(missing!.reason).toBe('unavailable');
  });

  it('allows taking exactly the last unit', () => {
    expect(findShortfalls([{ variantId: 'last', quantity: 1 }], levels)).toEqual(
      [],
    );
    expect(findShortfalls([{ variantId: 'last', quantity: 2 }], levels)).toHaveLength(
      1,
    );
  });
});

describe('trimming a basket to what is in stock', () => {
  it('reduces quantities and drops what has gone', () => {
    expect(
      trimToAvailable(
        [
          { variantId: 'in-stock', quantity: 3 },
          { variantId: 'low', quantity: 9 },
          { variantId: 'out', quantity: 2 },
          { variantId: 'withdrawn', quantity: 1 },
        ],
        levels,
      ),
    ).toEqual([
      { variantId: 'in-stock', quantity: 3 },
      { variantId: 'low', quantity: 2 },
    ]);
  });

  it('can empty a basket entirely', () => {
    expect(
      trimToAvailable([{ variantId: 'out', quantity: 1 }], levels),
    ).toEqual([]);
  });

  it('produces a basket that can be fulfilled', () => {
    const trimmed = trimToAvailable(
      [
        { variantId: 'low', quantity: 99 },
        { variantId: 'last', quantity: 99 },
      ],
      levels,
    );
    expect(canFulfil(trimmed, levels)).toBe(true);
  });
});

describe('stock messaging', () => {
  it('only says how many are left when the number is genuinely low', () => {
    expect(stockState(0)).toBe('out');
    expect(stockState(1)).toBe('last_one');
    expect(stockState(2)).toBe('low');
    expect(stockState(3)).toBe('low');
    expect(stockState(4)).toBe('in_stock');
    expect(stockState(400)).toBe('in_stock');
  });

  it('never invents scarcity for a well stocked item', () => {
    // The important assertion: no count appears in the label once there is
    // plenty, so there is no pressure phrasing to argue about.
    expect(stockLabel(50)).toBe('In stock');
    expect(stockLabel(50)).not.toMatch(/\d/);
  });

  it('states the real number when it is low', () => {
    expect(stockLabel(2)).toBe('Only 2 left');
    expect(stockLabel(1)).toBe('Last one');
    expect(stockLabel(0)).toBe('Out of stock');
  });

  it('treats a deactivated variant as out of stock', () => {
    expect(stockState(10, false)).toBe('out');
    expect(stockLabel(10, false)).toBe('Out of stock');
  });

  it('handles a negative count defensively', () => {
    // Should be impossible thanks to the CHECK constraint, but if one ever
    // appears the shop must say out of stock rather than crash.
    expect(stockState(-1)).toBe('out');
    expect(stockLabel(-1)).toBe('Out of stock');
  });
});
