import { describe, expect, it } from 'vitest';
import {
  clampToWindow,
  contains,
  mergeIntervals,
  overlaps,
  totalMinutes,
} from '@/lib/availability/overlap';
import { iv } from './helpers';

describe('overlaps, half-open [start, end) semantics', () => {
  it('treats touching intervals as non-overlapping so back-to-back bookings are legal', () => {
    expect(overlaps(iv('09:30-10:00'), iv('10:00-10:45'))).toBe(false);
    expect(overlaps(iv('10:00-10:45'), iv('09:30-10:00'))).toBe(false);
  });

  it('detects partial overlap from either side', () => {
    expect(overlaps(iv('09:45-10:15'), iv('10:00-10:45'))).toBe(true);
    expect(overlaps(iv('10:30-11:00'), iv('10:00-10:45'))).toBe(true);
  });

  it('detects containment in both directions', () => {
    expect(overlaps(iv('10:05-10:20'), iv('10:00-10:45'))).toBe(true);
    expect(overlaps(iv('09:00-12:00'), iv('10:00-10:45'))).toBe(true);
  });

  it('is symmetric for every case', () => {
    const pairs = [
      ['09:00-10:00', '10:00-11:00'],
      ['09:00-10:30', '10:00-11:00'],
      ['09:00-12:00', '10:00-11:00'],
      ['10:15-10:20', '10:00-11:00'],
    ] as const;
    for (const [a, b] of pairs) {
      expect(overlaps(iv(a), iv(b))).toBe(overlaps(iv(b), iv(a)));
    }
  });
});

describe('contains', () => {
  it('allows shared endpoints', () => {
    expect(contains(iv('08:00-17:00'), iv('08:00-08:30'))).toBe(true);
    expect(contains(iv('08:00-17:00'), iv('16:30-17:00'))).toBe(true);
  });

  it('rejects an interval that runs past the window', () => {
    expect(contains(iv('08:00-17:00'), iv('16:45-17:15'))).toBe(false);
  });
});

describe('mergeIntervals and totalMinutes', () => {
  it('coalesces overlapping and touching intervals', () => {
    expect(mergeIntervals([iv('09:00-10:00'), iv('10:00-11:00')])).toEqual([
      iv('09:00-11:00'),
    ]);
    expect(mergeIntervals([iv('09:00-10:30'), iv('10:00-11:00')])).toEqual([
      iv('09:00-11:00'),
    ]);
  });

  it('keeps disjoint intervals separate and sorts them', () => {
    expect(mergeIntervals([iv('14:00-15:00'), iv('09:00-10:00')])).toEqual([
      iv('09:00-10:00'),
      iv('14:00-15:00'),
    ]);
  });

  it('does not double count overlapping load', () => {
    expect(totalMinutes([iv('09:00-10:00'), iv('09:30-10:30')])).toBe(90);
  });
});

describe('clampToWindow', () => {
  it('trims an interval to the window', () => {
    expect(clampToWindow(iv('07:00-18:00'), iv('08:00-17:00'))).toEqual(
      iv('08:00-17:00'),
    );
  });

  it('returns null when disjoint', () => {
    expect(clampToWindow(iv('06:00-07:00'), iv('08:00-17:00'))).toBeNull();
  });
});
