'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AlertTriangle, Package, Search } from 'lucide-react';
import { Button, ButtonAnchor } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { cn } from '@/lib/cn';
import { BLUR_PLACEHOLDER } from '@/data/images';
import { store } from '@/data/store';
import { formatPrice } from '@/lib/currency';
import { FULFILMENT_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/domain/enums';
import { track } from '@/lib/analytics';
import type { OrderDto, OrderStatus } from '@/types';

/**
 * Order tracking.
 *
 * Reference plus the email it was placed with. There are no customer accounts
 * on this shop, which is a deliberate choice: an account is a password to
 * forget and a database of credentials to protect, and almost nobody buys a
 * phone often enough to want one. Two fields they already have does the same
 * job with nothing to breach.
 */

/**
 * The journey as the customer experiences it.
 *
 * It forks at the fourth step, because a collection and a delivery are
 * genuinely different journeys and showing a courier step to somebody
 * collecting from the counter is the kind of small wrongness that makes a
 * tracker feel automated rather than accurate.
 *
 * Cancelled and refunded are not steps on this path, so they get their own
 * state rather than being forced into a progress bar that would run backwards.
 */
function journeyFor(
  fulfilment: OrderDto['fulfilment'],
): readonly { status: OrderStatus; label: string; detail: string }[] {
  return [
    {
      status: 'pending_payment',
      label: 'Order placed',
      detail: 'Your stock is held and we are waiting for payment.',
    },
    {
      status: 'paid',
      label: 'Payment received',
      detail: 'Thank you. We are getting it ready.',
    },
    {
      status: 'packing',
      label: 'Being prepared',
      detail: 'Final test, clean and pack.',
    },
    fulfilment === 'collect'
      ? {
          status: 'ready_for_collection',
          label: 'Ready for you',
          detail: 'Waiting at the counter. Bring the reference and your ID.',
        }
      : {
          status: 'shipped',
          label: 'On its way',
          detail: 'Collected by the courier. Your tracking number follows by email.',
        },
    {
      status: 'completed',
      label: 'Complete',
      detail: 'With you. Your warranty runs from this date.',
    },
  ];
}

export function OrderLookup() {
  const [result, setResult] = useState<{
    order: OrderDto;
    statusLabel: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: String(form.get('reference') ?? ''),
          email: String(form.get('email') ?? ''),
        }),
      });
      const body: unknown = await response.json();

      if (response.ok) {
        setResult(body as { order: OrderDto; statusLabel: string });
        track({ name: 'order_lookup', found: true });
        return;
      }

      const failure = body as {
        error?: { message?: string; fieldErrors?: Record<string, string[]> };
      };
      setFieldErrors(failure.error?.fieldErrors ?? {});
      setError(
        failure.error?.message ??
          'We could not find an order with that reference and email.',
      );
      setResult(null);
      track({ name: 'order_lookup', found: false });
    } catch {
      setError(
        'We could not reach the shop just then. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[20rem_1fr] lg:gap-14">
      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-card border border-line bg-paper p-5"
      >
        <h2 className="text-[1rem] font-bold text-ink">Find your order</h2>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-grey-strong">
          Both are on your confirmation. No account and no password.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <TextField
            name="reference"
            label="Order reference"
            required
            placeholder="AB-4K2M9X"
            autoComplete="off"
            error={fieldErrors.reference?.[0]}
          />
          <TextField
            name="email"
            label="Email you ordered with"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            error={fieldErrors.email?.[0]}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-panel border border-red/30 bg-red-soft p-3 text-[0.8125rem] leading-relaxed text-ink"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-red-deep"
              aria-hidden="true"
            />
            {error}
          </p>
        )}

        <Button
          type="submit"
          block
          className="mt-5"
          loading={loading}
          loadingLabel="Looking"
        >
          <Search className="size-4" aria-hidden="true" />
          Find my order
        </Button>

        <p className="mt-4 text-[0.75rem] leading-relaxed text-grey">
          Lost the reference? Phone us on{' '}
          <a
            href={`tel:${store.telephone.e164}`}
            className="font-semibold text-ink hover:text-red"
          >
            {store.telephone.display}
          </a>{' '}
          and we will find it from your name.
        </p>
      </form>

      <div>
        {result ? (
          <OrderDetail order={result.order} statusLabel={result.statusLabel} />
        ) : (
          <div className="flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
            <Package className="size-8 text-grey" aria-hidden="true" />
            <p className="mt-4 text-[0.9375rem] font-semibold text-ink">
              Your order will appear here
            </p>
            <p className="mt-1.5 max-w-sm text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
              Everything about it: what you bought, what you paid, where it is
              and what happens next.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetail({
  order,
  statusLabel,
}: {
  readonly order: OrderDto;
  readonly statusLabel: string;
}) {
  const ended = order.status === 'cancelled' || order.status === 'refunded';
  const journey = journeyFor(order.fulfilment);
  const currentIndex = journey.findIndex((step) => step.status === order.status);

  const placed = new Date(order.placedAt).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <article className="flex flex-col gap-8">
      <header className="rounded-card border border-line bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
              Order
            </p>
            <p className="text-spec mt-1 text-[1.25rem] font-medium text-ink">
              {order.reference}
            </p>
            <p className="mt-1 text-[0.8125rem] text-grey-strong">
              Placed {placed}
            </p>
          </div>
          <span
            className={cn(
              'rounded-panel px-3 py-1.5 text-[0.8125rem] font-semibold',
              ended ? 'bg-canvas-deep text-grey-strong' : 'bg-leaf-soft text-leaf-deep',
            )}
          >
            {statusLabel}
          </span>
        </div>
      </header>

      {/* ---------------- Progress ---------------- */}
      {ended ? (
        <section className="rounded-card border border-line bg-paper p-5">
          <h2 className="text-[0.9375rem] font-bold text-ink">
            This order is {statusLabel.toLowerCase()}
          </h2>
          <p className="mt-1.5 text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
            Anything already paid is returned to the account it came from, which
            usually takes two to three working days to reflect. Phone us if you
            would like it explained.
          </p>
        </section>
      ) : (
        <section aria-labelledby="progress-heading">
          <h2
            id="progress-heading"
            className="text-[0.6875rem] font-semibold uppercase text-grey-strong"
          >
            Where it is
          </h2>
          <ol className="mt-4">
            {journey.map((step, index) => {
              const done = currentIndex >= 0 && index <= currentIndex;
              const current = index === currentIndex;
              return (
                <li key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                        done
                          ? 'border-ink bg-ink'
                          : 'border-line-strong bg-white',
                      )}
                      aria-hidden="true"
                    >
                      {done && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    {index < journey.length - 1 && (
                      <span
                        className={cn(
                          'w-0.5 flex-1',
                          done ? 'bg-ink' : 'bg-line',
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className={cn('pb-6', !done && 'opacity-55')}>
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      {step.label}
                      {/* The state is in words as well as in the marker, so it
                          does not depend on seeing the filled circle. */}
                      {current && (
                        <span className="ml-2 text-[0.75rem] font-medium text-red">
                          Now
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
                      {step.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ---------------- What is in it ---------------- */}
      <section aria-labelledby="items-heading">
        <h2
          id="items-heading"
          className="text-[0.6875rem] font-semibold uppercase text-grey-strong"
        >
          What you bought
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {order.lines.map((line) => (
            <li
              key={`${line.name}-${line.variantLabel}`}
              className="flex gap-4 rounded-card border border-line bg-white p-4"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-panel bg-canvas">
                {line.imageUrl && (
                  <Image
                    src={line.imageUrl}
                    alt=""
                    fill
                    sizes="64px"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-semibold text-ink">
                    {line.name}
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] text-grey-strong">
                    {line.variantLabel}
                    {line.quantity > 1 ? `, ${line.quantity}` : ''}
                  </p>
                  <p className="mt-0.5 text-[0.75rem] text-grey">
                    Covered for {line.warrantyMonths} months
                  </p>
                </div>
                <p className="shrink-0 text-[0.9375rem] font-bold tabular-nums text-ink">
                  {formatPrice(line.lineTotalCents)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- Totals and delivery ---------------- */}
      <div className="grid gap-6 sm:grid-cols-2">
        <section
          aria-labelledby="totals-heading"
          className="rounded-card border border-line bg-paper p-5"
        >
          <h2 id="totals-heading" className="text-[0.9375rem] font-bold text-ink">
            What you paid
          </h2>
          <dl className="mt-4 flex flex-col gap-2 text-[0.875rem]">
            <div className="flex justify-between gap-3">
              <dt className="text-grey-strong">Subtotal</dt>
              <dd className="tabular-nums text-ink">
                {formatPrice(order.subtotalCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-grey-strong">
                {order.fulfilment === 'collect' ? 'Collection' : 'Delivery'}
              </dt>
              <dd className="tabular-nums text-ink">
                {order.shippingCents === 0
                  ? 'Free'
                  : formatPrice(order.shippingCents)}
              </dd>
            </div>
            {order.tradeInCents > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-grey-strong">Trade in</dt>
                <dd className="tabular-nums text-leaf">
                  Less {formatPrice(order.tradeInCents)}
                </dd>
              </div>
            )}
            <div className="mt-2 flex justify-between gap-3 border-t border-line pt-3">
              <dt className="font-bold text-ink">Total</dt>
              <dd className="font-bold tabular-nums text-ink">
                {formatPrice(order.totalCents)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[0.75rem] text-grey">
            {PAYMENT_METHOD_LABELS[order.paymentMethod]}. Includes VAT.
          </p>
        </section>

        <section
          aria-labelledby="delivery-heading"
          className="rounded-card border border-line bg-paper p-5"
        >
          <h2
            id="delivery-heading"
            className="text-[0.9375rem] font-bold text-ink"
          >
            {FULFILMENT_LABELS[order.fulfilment]}
          </h2>
          {order.fulfilment === 'delivery' && order.deliveryAddress.length > 0 ? (
            <address className="mt-3 not-italic text-[0.875rem] leading-relaxed text-grey-strong">
              {order.customerName}
              <br />
              {order.deliveryAddress.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </address>
          ) : (
            <address className="mt-3 not-italic text-[0.875rem] leading-relaxed text-grey-strong">
              {store.address.line1}
              <br />
              {store.address.line2}
              <br />
              {store.address.suburb}, {store.address.city}
              <br />
              {store.parking}
            </address>
          )}
          <ButtonAnchor
            href={`tel:${store.telephone.e164}`}
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            Phone the shop
          </ButtonAnchor>
        </section>
      </div>
    </article>
  );
}
