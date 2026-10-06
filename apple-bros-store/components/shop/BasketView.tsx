'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Primitives';
import { cn } from '@/lib/cn';
import { BLUR_PLACEHOLDER } from '@/data/images';
import { store } from '@/data/store';
import { formatPrice } from '@/lib/currency';
import { CONDITION_SHORT } from '@/lib/domain/enums';
import { track } from '@/lib/analytics';
import { BASKET_MAX_QUANTITY, useBasket } from '@/hooks/useBasket';

/**
 * The basket.
 *
 * Two jobs beyond listing lines. First, it checks live stock when it opens, so
 * a device that sold while the basket sat in a tab is flagged here rather than
 * at the end of checkout. Second, it offers a one-click fix for that, because
 * telling somebody their basket is wrong without offering to correct it is
 * half a feature.
 *
 * The stock check is advisory. The order transaction re-reads everything and
 * is the only thing that decides whether a sale happens.
 */

interface StockLevel {
  readonly variantId: string;
  readonly stockQuantity: number;
  readonly isActive: boolean;
  readonly priceCents: number;
}

export function BasketView() {
  const basket = useBasket();
  const { lines, hydrated } = basket;

  /**
   * The fetched levels are tagged with the basket they describe, so "is this
   * check current" is derived at render by comparing tags. No separate loading
   * flag, and no state write at the top of the effect.
   */
  const stockKey = useMemo(
    () =>
      lines
        .map((l) => `${l.variantId}:${l.quantity}`)
        .sort()
        .join(','),
    [lines],
  );

  const [checked, setChecked] = useState<{
    key: string;
    levels: readonly StockLevel[];
  } | null>(null);

  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    const controller = new AbortController();
    const variantIds = lines.map((l) => l.variantId);

    fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantIds }),
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((r) =>
        r.ok ? (r.json() as Promise<{ levels: StockLevel[] }>) : null,
      )
      .then((data) => {
        setChecked({ key: stockKey, levels: data?.levels ?? [] });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // Settle with no levels. The basket then shows its stored prices and
        // lets the customer proceed; checkout will catch anything wrong. A
        // failed advisory check must not block a sale.
        setChecked({ key: stockKey, levels: [] });
      });

    return () => controller.abort();
  }, [stockKey, hydrated, lines]);

  const levels = checked?.key === stockKey ? checked.levels : null;
  const levelFor = (variantId: string) =>
    levels?.find((l) => l.variantId === variantId) ?? null;

  const shortfalls = (levels ?? []).filter((level) => {
    const line = lines.find((l) => l.variantId === level.variantId);
    return line ? !level.isActive || level.stockQuantity < line.quantity : false;
  });

  const priceChanges = (levels ?? []).filter((level) => {
    const line = lines.find((l) => l.variantId === level.variantId);
    return (
      line !== undefined &&
      level.isActive &&
      level.priceCents > 0 &&
      level.priceCents !== line.priceCents
    );
  });

  /** Live totals where we have them, stored ones otherwise. */
  const subtotalCents = lines.reduce((sum, line) => {
    const level = levelFor(line.variantId);
    const unit = level?.isActive && level.priceCents > 0
      ? level.priceCents
      : line.priceCents;
    return sum + unit * line.quantity;
  }, 0);

  const freeDelivery = subtotalCents >= store.freeDeliveryThresholdCents;
  const shippingCents = freeDelivery ? 0 : store.standardDeliveryCents;

  if (!hydrated) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <ul className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <li key={i} className="flex gap-4 rounded-card border border-line p-4">
              <Skeleton className="size-24 shrink-0 rounded-panel" />
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
                <Skeleton className="mt-6 h-4 w-20" />
              </div>
            </li>
          ))}
        </ul>
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShoppingBag className="mx-auto size-8 text-grey" aria-hidden="true" />
        <h2 className="mt-4 text-[1.25rem] font-bold text-ink">
          Your basket is empty
        </h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-grey-strong">
          Everything on the shelf is graded, tested and covered for twelve
          months. Start with the category you are after.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/shop/iphone">Shop iPhone</ButtonLink>
          <ButtonLink href="/shop" variant="secondary">
            Everything we stock
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12">
      <div>
        {shortfalls.length > 0 && (
          <div
            role="alert"
            className="mb-6 rounded-card border border-red/30 bg-red-soft p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 size-5 shrink-0 text-red-deep"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h2 className="text-[0.9375rem] font-bold text-ink">
                  Stock has changed since you added these
                </h2>
                <ul className="mt-2 flex flex-col gap-1 text-[0.8125rem] leading-relaxed text-ink">
                  {shortfalls.map((level) => {
                    const line = lines.find(
                      (l) => l.variantId === level.variantId,
                    );
                    if (!line) return null;
                    return (
                      <li key={level.variantId}>
                        <span className="font-semibold">{line.productName}</span>
                        {', '}
                        {!level.isActive || level.stockQuantity === 0
                          ? 'now sold out.'
                          : `only ${level.stockQuantity} left, you asked for ${line.quantity}.`}
                      </li>
                    );
                  })}
                </ul>
                <Button
                  variant="critical"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    basket.applyAvailable(
                      new Map(
                        (levels ?? []).map((l) => [
                          l.variantId,
                          l.isActive ? l.stockQuantity : 0,
                        ]),
                      ),
                    )
                  }
                >
                  Fix my basket
                </Button>
              </div>
            </div>
          </div>
        )}

        {priceChanges.length > 0 && (
          <p
            role="status"
            className="mb-6 rounded-card border border-line-strong bg-canvas p-4 text-[0.8125rem] leading-relaxed text-ink"
          >
            Prices on one or more of these have changed since you added them.
            The totals below and at checkout use the current price.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {lines.map((line) => {
            const level = levelFor(line.variantId);
            const unitCents =
              level?.isActive && level.priceCents > 0
                ? level.priceCents
                : line.priceCents;
            const max = Math.min(
              level?.isActive ? level.stockQuantity : BASKET_MAX_QUANTITY,
              BASKET_MAX_QUANTITY,
            );
            const soldOut = level !== null && (!level.isActive || level.stockQuantity === 0);

            return (
              <li
                key={line.variantId}
                className={cn(
                  'flex gap-4 rounded-card border border-line bg-white p-4',
                  soldOut && 'border-red/30',
                )}
              >
                <Link
                  href={`/product/${line.productSlug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-panel bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  {line.imageUrl && (
                    <Image
                      src={line.imageUrl}
                      alt=""
                      fill
                      sizes="96px"
                      placeholder="blur"
                      blurDataURL={BLUR_PLACEHOLDER}
                      className={cn('object-cover', soldOut && 'opacity-50 saturate-50')}
                    />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-[0.9375rem] font-semibold leading-snug text-ink">
                        <Link
                          href={`/product/${line.productSlug}`}
                          className="rounded-panel hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                        >
                          {line.productName}
                        </Link>
                      </h3>
                      <p className="mt-0.5 text-[0.8125rem] text-grey-strong">
                        {line.variantLabel}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-grey">
                        {CONDITION_SHORT[line.condition]} grade, covered for{' '}
                        {store.usedWarrantyMonths} months
                      </p>
                    </div>
                    <p className="shrink-0 text-[0.9375rem] font-bold tabular-nums text-ink">
                      {formatPrice(unitCents * line.quantity)}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    {soldOut ? (
                      <p className="text-[0.8125rem] font-semibold text-red-deep">
                        Sold out
                      </p>
                    ) : (
                      <div className="inline-flex items-center rounded-panel border border-line-strong">
                        <button
                          type="button"
                          aria-label={`One fewer ${line.productName}`}
                          disabled={line.quantity <= 1}
                          onClick={() =>
                            basket.setQuantity(line.variantId, line.quantity - 1)
                          }
                          className="flex size-9 items-center justify-center rounded-l-panel text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                        >
                          <Minus className="size-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-9 text-center text-[0.875rem] font-semibold tabular-nums text-ink">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`One more ${line.productName}`}
                          disabled={line.quantity >= max}
                          onClick={() =>
                            basket.setQuantity(line.variantId, line.quantity + 1)
                          }
                          className="flex size-9 items-center justify-center rounded-r-panel text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        track({
                          name: 'remove_from_basket',
                          variantId: line.variantId,
                          quantity: line.quantity,
                        });
                        basket.remove(line.variantId);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-panel px-2 py-1 text-[0.8125rem] font-medium text-grey-strong transition-colors duration-[--duration-feedback] hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Remove
                      <span className="sr-only"> {line.productName}</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/shop"
            className="text-[0.875rem] font-semibold text-ink underline decoration-red decoration-2 underline-offset-4 transition-colors duration-[--duration-feedback] hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            Keep shopping
          </Link>
          <ClearBasketButton onConfirm={basket.clear} count={basket.itemCount} />
        </div>
      </div>

      {/* ---------------- Summary ---------------- */}
      <aside
        aria-labelledby="summary-heading"
        className="rounded-card border border-line bg-paper p-5 lg:sticky lg:top-24"
      >
        <h2 id="summary-heading" className="text-[1rem] font-bold text-ink">
          Order summary
        </h2>

        <dl className="mt-5 flex flex-col gap-3 text-[0.875rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-grey-strong">
              Subtotal, {basket.itemCount}{' '}
              {basket.itemCount === 1 ? 'item' : 'items'}
            </dt>
            <dd className="font-semibold tabular-nums text-ink">
              {formatPrice(subtotalCents)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-grey-strong">Delivery</dt>
            <dd
              className={cn(
                'font-semibold tabular-nums',
                freeDelivery ? 'text-leaf' : 'text-ink',
              )}
            >
              {freeDelivery ? 'Free' : formatPrice(shippingCents)}
            </dd>
          </div>
          <div className="mt-2 flex justify-between gap-4 border-t border-line pt-4">
            <dt className="text-[1rem] font-bold text-ink">Total</dt>
            <dd className="text-[1.125rem] font-bold tabular-nums text-ink">
              {formatPrice(subtotalCents + shippingCents)}
            </dd>
          </div>
        </dl>

        <p className="mt-2 text-[0.75rem] text-grey">
          Includes VAT. Collection is free, which you can choose at checkout.
        </p>

        {!freeDelivery && (
          <p className="mt-4 rounded-panel bg-white px-3 py-2.5 text-[0.8125rem] leading-relaxed text-ink">
            Add{' '}
            <span className="font-semibold tabular-nums">
              {formatPrice(store.freeDeliveryThresholdCents - subtotalCents)}
            </span>{' '}
            for free delivery.
          </p>
        )}

        <ButtonLink
          href="/checkout"
          variant="critical"
          size="lg"
          block
          className="mt-5"
          onClick={() =>
            track({
              name: 'checkout_started',
              itemCount: basket.itemCount,
              valueCents: subtotalCents,
            })
          }
        >
          Checkout
          <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>

        <p className="mt-3 text-center text-[0.75rem] leading-relaxed text-grey">
          No card details are entered on this site. You pay by EFT or on
          collection.
        </p>
      </aside>
    </div>
  );
}

/**
 * Emptying the basket is destructive and cannot be undone, so it goes behind an
 * AlertDialog. Removing a single line does not, because the item is one click
 * from being added back.
 */
function ClearBasketButton({
  onConfirm,
  count,
}: {
  readonly onConfirm: () => void;
  readonly count: number;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className="inline-flex items-center gap-1.5 rounded-panel px-2 py-1 text-[0.875rem] font-medium text-grey-strong transition-colors duration-[--duration-feedback] hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red">
        <Trash2 className="size-3.5" aria-hidden="true" />
        Empty basket
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-overlay bg-ink/40" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-modal w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-white p-6 shadow-[0_24px_60px_-20px_rgb(13_17_23/0.35)]">
          <AlertDialog.Title className="text-[1.125rem] font-bold text-ink">
            Empty your basket?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
            This removes all {count} {count === 1 ? 'item' : 'items'}. Stock is
            one device at a time, so anything you are holding may be gone by the
            time you come back for it.
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Close
              render={<Button variant="secondary">Keep my basket</Button>}
            />
            <AlertDialog.Close
              onClick={onConfirm}
              render={<Button variant="critical">Empty it</Button>}
            />
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
