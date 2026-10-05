'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { BasketLine } from '@/types';

/**
 * Basket state.
 *
 * Held in this browser only, in localStorage, because a basket of toothpaste
 * is a convenience rather than a record. Nothing is written to the database
 * until an order is actually placed, so there is no abandoned-basket data
 * sitting on a server about somebody who never bought anything.
 *
 * Implemented as an external store read through useSyncExternalStore rather
 * than as React state hydrated by an effect. That is the right primitive for
 * this: localStorage genuinely is state living outside React, the server has
 * no access to it, and reading it during the first client render would
 * produce markup that does not match what the server sent.
 *
 * Doing it this way also means no setState in an effect, no cascading render
 * on mount, and cross-tab synchronisation for free, because another tab
 * writing to localStorage fires a storage event that this store listens for.
 */

const STORAGE_KEY = 'hds.basket.v1';
const MAX_QUANTITY = 20;

/* ------------------------------------------------------------------ */
/* The store                                                           */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();

/**
 * The parsed snapshot, cached.
 *
 * useSyncExternalStore calls getSnapshot on every render and compares the
 * result by identity, so it must return the same object until the data
 * actually changes. Re-parsing the JSON each call would return a new array
 * every time and loop forever.
 */
let cache: readonly BasketLine[] = [];
let cacheRaw: string | null = null;
let hydrated = false;

const EMPTY: readonly BasketLine[] = [];

function isBasketLine(value: unknown): value is BasketLine {
  if (typeof value !== 'object' || value === null) return false;
  const line = value as Partial<BasketLine>;
  return (
    typeof line.productId === 'string' &&
    typeof line.slug === 'string' &&
    typeof line.name === 'string' &&
    typeof line.priceCents === 'number' &&
    typeof line.imageUrl === 'string' &&
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
    // Private browsing, or site data blocked. The basket simply will not
    // survive a reload.
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
    // Storage unavailable. Keep the in-memory copy so the current page view
    // still works.
    cacheRaw = null;
    cache = lines;
  }
  // Re-read so the cached snapshot and the stored value cannot diverge.
  readStorage();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Another tab writing to the same key.
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

function subscribeHydrated(listener: () => void): () => void {
  return subscribe(listener);
}

function getHydratedSnapshot(): boolean {
  return hydrated;
}

function getHydratedServerSnapshot(): boolean {
  return false;
}

/* ------------------------------------------------------------------ */
/* Provider and hook                                                   */
/* ------------------------------------------------------------------ */

/**
 * Kept as a component so the public layout reads the same way, and so a
 * future move to a server-side basket has one obvious place to go. There is
 * no context value: the store is module level, which is what allows the
 * cross-tab subscription to be shared.
 */
export function BasketProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export interface BasketApi {
  readonly lines: readonly BasketLine[];
  readonly itemCount: number;
  readonly subtotalCents: number;
  /** False during the first client render, before storage has been read. */
  readonly hydrated: boolean;
  add(line: Omit<BasketLine, 'quantity'>, quantity?: number): void;
  setQuantity(productId: string, quantity: number): void;
  remove(productId: string): void;
  clear(): void;
}

export function useBasket(): BasketApi {
  const lines = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribeHydrated,
    getHydratedSnapshot,
    getHydratedServerSnapshot,
  );

  const add = useCallback(
    (line: Omit<BasketLine, 'quantity'>, quantity = 1) => {
      const current = readStorage();
      const existing = current.find((l) => l.productId === line.productId);
      write(
        existing
          ? current.map((l) =>
              l.productId === line.productId
                ? {
                    ...l,
                    quantity: Math.min(l.quantity + quantity, MAX_QUANTITY),
                  }
                : l,
            )
          : [
              ...current,
              { ...line, quantity: Math.min(quantity, MAX_QUANTITY) },
            ],
      );
    },
    [],
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = readStorage();
    write(
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) =>
            l.productId === productId
              ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) }
              : l,
          ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    write(readStorage().filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => write([]), []);

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
    }),
    [lines, isHydrated, add, setQuantity, remove, clear],
  );
}
