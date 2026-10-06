'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { BasketLine } from '@/types';

/**
 * Basket state.
 *
 * Held in this browser only, in localStorage. Nothing is written to the
 * database until an order is actually placed, so there is no abandoned basket
 * data sitting on a server about somebody who never bought anything.
 *
 * Read through useSyncExternalStore, which is the correct primitive for state
 * that genuinely lives outside React. It also means no setState in an effect,
 * no cascading render on mount, and cross-tab synchronisation for free: a
 * second tab adding an item updates this one.
 *
 * The prices cached here are for display only. Checkout re-reads every price
 * and stock level from the database, so a tampered basket buys nothing.
 */

const STORAGE_KEY = 'ab.basket.v1';

/** Per line. Nobody legitimately buys nine of the same graded handset. */
const MAX_QUANTITY = 5;

const listeners = new Set<() => void>();

/**
 * Cached snapshot.
 *
 * useSyncExternalStore calls getSnapshot on every render and compares by
 * identity, so it must return the same array until the data actually changes.
 * Re-parsing the JSON each call would return a new array every time and loop
 * forever.
 */
let cache: readonly BasketLine[] = [];
let cacheRaw: string | null = null;
let hydrated = false;

const EMPTY: readonly BasketLine[] = [];

function isBasketLine(value: unknown): value is BasketLine {
  if (typeof value !== 'object' || value === null) return false;
  const line = value as Partial<BasketLine>;
  return (
    typeof line.variantId === 'string' &&
    typeof line.productSlug === 'string' &&
    typeof line.productName === 'string' &&
    typeof line.variantLabel === 'string' &&
    typeof line.priceCents === 'number' &&
    typeof line.quantity === 'number' &&
    line.quantity > 0
  );
}

function readStorage(): readonly BasketLine[] {
  if (typeof window === 'undefined') return EMPTY;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing, or site data blocked. The basket works for this page
    // view and simply will not survive a reload.
    return EMPTY;
  }

  if (raw === cacheRaw) return cache;

  cacheRaw = raw;
  if (!raw) {
    cache = EMPTY;
    return cache;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    // Validated rather than trusted: storage may have been written by an
    // older version of the site, or edited by hand.
    cache = Array.isArray(parsed) ? parsed.filter(isBasketLine) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(lines: readonly BasketLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    cacheRaw = null;
    cache = lines;
  }
  readStorage();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      cacheRaw = null;
      readStorage();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): readonly BasketLine[] {
  hydrated = true;
  return readStorage();
}

/** The server has no basket, so it renders an empty one. */
function getServerSnapshot(): readonly BasketLine[] {
  return EMPTY;
}

function getHydrated(): boolean {
  return hydrated;
}

function getHydratedServer(): boolean {
  return false;
}

export interface BasketApi {
  readonly lines: readonly BasketLine[];
  readonly itemCount: number;
  readonly subtotalCents: number;
  /** False during the first client render, before storage has been read. */
  readonly hydrated: boolean;
  add(line: Omit<BasketLine, 'quantity'>, quantity?: number): void;
  setQuantity(variantId: string, quantity: number): void;
  remove(variantId: string): void;
  clear(): void;
  /** Reconcile against server stock after a failed checkout. */
  applyAvailable(available: ReadonlyMap<string, number>): void;
}

export function useBasket(): BasketApi {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isHydrated = useSyncExternalStore(
    subscribe,
    getHydrated,
    getHydratedServer,
  );

  const add = useCallback(
    (line: Omit<BasketLine, 'quantity'>, quantity = 1) => {
      const current = readStorage();
      const existing = current.find((l) => l.variantId === line.variantId);
      write(
        existing
          ? current.map((l) =>
              l.variantId === line.variantId
                ? {
                    ...l,
                    // Refresh the cached display fields at the same time, so
                    // a price change is at least visible in the basket.
                    ...line,
                    quantity: Math.min(l.quantity + quantity, MAX_QUANTITY),
                  }
                : l,
            )
          : [...current, { ...line, quantity: Math.min(quantity, MAX_QUANTITY) }],
      );
    },
    [],
  );

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    const current = readStorage();
    write(
      quantity <= 0
        ? current.filter((l) => l.variantId !== variantId)
        : current.map((l) =>
            l.variantId === variantId
              ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) }
              : l,
          ),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    write(readStorage().filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => write([]), []);

  /**
   * Trim the basket to what the server says is actually available.
   *
   * Used by the one-click fix when checkout reports a shortfall, so the
   * customer does not have to work out which line to edit.
   */
  const applyAvailable = useCallback(
    (available: ReadonlyMap<string, number>) => {
      write(
        readStorage()
          .map((line) => {
            const max = available.get(line.variantId);
            if (max === undefined) return line;
            if (max <= 0) return null;
            return { ...line, quantity: Math.min(line.quantity, max) };
          })
          .filter((l): l is BasketLine => l !== null),
      );
    },
    [],
  );

  return useMemo(
    () => ({
      lines,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotalCents: lines.reduce(
        (sum, l) => sum + l.priceCents * l.quantity,
        0,
      ),
      hydrated: isHydrated,
      add,
      setQuantity,
      remove,
      clear,
      applyAvailable,
    }),
    [lines, isHydrated, add, setQuantity, remove, clear, applyAvailable],
  );
}

export const BASKET_MAX_QUANTITY = MAX_QUANTITY;
