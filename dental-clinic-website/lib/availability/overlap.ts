/**
 * Interval arithmetic for the availability engine. Pure, no imports.
 */
import type { Interval } from './types';

/**
 * THE overlap predicate. Every availability decision in the application routes
 * through this one function, so that display, server-side validation and the
 * admin calendar can never disagree about what a collision is.
 *
 *   overlaps(a, b)  <=>  a.start < b.end  &&  b.start < a.end
 *
 * Half-open [start, end) semantics, with two intentional consequences:
 *
 *  - Touching intervals do NOT overlap. [09:30, 10:00) against [10:00, 10:45)
 *    is false, so back-to-back appointments are legal. That is how a real
 *    chair runs, and it is the case a naive `<=` comparison gets wrong.
 *  - Containment overlaps in both directions.
 */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** True when `inner` fits entirely inside `outer`, shared endpoints allowed. */
export function contains(outer: Interval, inner: Interval): boolean {
  return inner.start >= outer.start && inner.end <= outer.end;
}

export function overlapsAny(a: Interval, list: readonly Interval[]): boolean {
  for (const b of list) {
    if (overlaps(a, b)) return true;
  }
  return false;
}

/** Sort and coalesce touching or overlapping intervals. */
export function mergeIntervals(list: readonly Interval[]): Interval[] {
  if (list.length === 0) return [];
  const sorted = [...list].sort((x, y) => x.start - y.start || x.end - y.end);
  const merged: Interval[] = [{ ...sorted[0]! }];
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (current.start <= last.end) {
      if (current.end > last.end) {
        merged[merged.length - 1] = { start: last.start, end: current.end };
      }
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

/** Total minutes covered by `list` after merging. Feeds the load tie-break. */
export function totalMinutes(list: readonly Interval[]): number {
  return mergeIntervals(list).reduce((sum, i) => sum + (i.end - i.start), 0);
}

/** Intersect an interval with a window, or null when they are disjoint. */
export function clampToWindow(i: Interval, window: Interval): Interval | null {
  const start = Math.max(i.start, window.start);
  const end = Math.min(i.end, window.end);
  return start < end ? { start, end } : null;
}

/**
 * Whether `window` is entirely covered by `intervals`.
 *
 * Used to tell a day that is blocked off from a day that is merely fully
 * booked, which matter differently to the reader: "the practice is closed" and
 * "every appointment has gone" need different copy and lead to different next
 * actions.
 */
export function isFullyCovered(
  window: Interval,
  intervals: readonly Interval[],
): boolean {
  let cursor = window.start;
  for (const interval of mergeIntervals(intervals)) {
    // A gap before this interval starts means the window is not covered.
    if (interval.start > cursor) return false;
    if (interval.end > cursor) cursor = interval.end;
    if (cursor >= window.end) return true;
  }
  return cursor >= window.end;
}

/** Round `value` up to the next grid step measured from `anchor`. */
export function ceilToGrid(value: number, step: number, anchor = 0): number {
  if (value <= anchor) return anchor;
  return anchor + Math.ceil((value - anchor) / step) * step;
}
