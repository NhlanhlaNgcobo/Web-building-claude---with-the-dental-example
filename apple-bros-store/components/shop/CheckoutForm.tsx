'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Package,
  Store as StoreIcon,
  Truck,
} from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { CheckboxField, TextAreaField, TextField } from '@/components/ui/TextField';
import { cn } from '@/lib/cn';
import { store } from '@/data/store';
import { formatPrice } from '@/lib/currency';
import {
  FULFILMENT_LABELS,
  PAYMENT_METHOD_LABELS,
  type FulfilmentMethod,
  type PaymentMethod,
} from '@/lib/domain/enums';
import { track } from '@/lib/analytics';
import { useBasket } from '@/hooks/useBasket';

/**
 * Checkout.
 *
 * It completes. There is no gateway wired up and no card field anywhere, and
 * that is a deliberate design rather than a gap: the customer pays by EFT
 * against a reference, or by card at the counter when they collect. Both are
 * ordinary ways to buy in South Africa, both are real, and neither puts a card
 * number through this site.
 *
 * Validation is the server's. Zod on the route is the authority and its
 * per-field messages are rendered under the fields they belong to, so there is
 * one set of rules rather than two that can disagree.
 */

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
] as const;

interface PlacedOrder {
  readonly reference: string;
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly tradeInCents: number;
  readonly totalCents: number;
  readonly payment: { instruction: string; redirectUrl: string | null } | null;
}

interface Shortfall {
  readonly variantId: string;
  readonly requested: number;
  readonly available: number;
  readonly reason: string;
}

export function CheckoutForm({
  paymentMethods,
}: {
  /** What the configured provider can actually complete. */
  readonly paymentMethods: readonly PaymentMethod[];
}) {
  const basket = useBasket();

  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    paymentMethods[0] ?? 'eft',
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [tradeInReference, setTradeInReference] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [shortfalls, setShortfalls] = useState<readonly Shortfall[]>([]);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const subtotalCents = basket.subtotalCents;
  const shippingCents =
    fulfilment === 'collect'
      ? 0
      : subtotalCents >= store.freeDeliveryThresholdCents
        ? 0
        : store.standardDeliveryCents;

  const errorFor = (field: string) => fieldErrors[field]?.[0];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setShortfalls([]);

    const payload = {
      lines: basket.lines.map((l) => ({
        variantId: l.variantId,
        quantity: l.quantity,
      })),
      customerName: String(form.get('customerName') ?? ''),
      customerEmail: String(form.get('customerEmail') ?? ''),
      customerMobile: String(form.get('customerMobile') ?? ''),
      fulfilment,
      paymentMethod,
      ...(fulfilment === 'delivery'
        ? {
            addressLine1: String(form.get('addressLine1') ?? ''),
            addressLine2: String(form.get('addressLine2') ?? ''),
            suburb: String(form.get('suburb') ?? ''),
            city: String(form.get('city') ?? ''),
            province: String(form.get('province') ?? ''),
            postalCode: String(form.get('postalCode') ?? ''),
          }
        : {}),
      notes: String(form.get('notes') ?? ''),
      ...(tradeInReference.trim() ? { tradeInReference: tradeInReference.trim() } : {}),
      marketingOptIn,
      acceptedTerms,
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body: unknown = await response.json();

      if (response.ok) {
        const order = body as PlacedOrder;
        track({
          name: 'order_placed',
          itemCount: basket.itemCount,
          valueCents: order.totalCents,
          fulfilment,
          paymentMethod,
          usedTradeIn: order.tradeInCents > 0,
        });
        // Emptied only once the order exists, so a failed attempt never costs
        // somebody their basket.
        basket.clear();
        setPlaced(order);

        if (order.payment?.redirectUrl) {
          window.location.assign(order.payment.redirectUrl);
        }
        return;
      }

      const failure = body as {
        error?: { message?: string; fieldErrors?: Record<string, string[]> };
        shortfalls?: readonly Shortfall[];
      };
      setFieldErrors(failure.error?.fieldErrors ?? {});
      setShortfalls(failure.shortfalls ?? []);
      setFormError(
        failure.error?.message ??
          'We could not place that order. Please check the details and try again.',
      );
      track({
        name: 'checkout_failed',
        reason: failure.error?.message ?? 'unknown',
      });
    } catch {
      setFormError(
        'We could not reach the shop just then. Check your connection and try again; nothing has been ordered.',
      );
      track({ name: 'checkout_failed', reason: 'network' });
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------- Confirmation ---------------- */
  if (placed) {
    return <OrderPlaced order={placed} fulfilment={fulfilment} />;
  }

  if (basket.hydrated && basket.lines.length === 0) {
    return (
      <div className="rounded-card border border-line bg-paper p-8 text-center">
        <Package className="mx-auto size-7 text-grey" aria-hidden="true" />
        <h2 className="mt-4 text-[1.125rem] font-bold text-ink">
          There is nothing to check out
        </h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-grey-strong">
          Your basket is empty. Add a device and the total will appear here.
        </p>
        <ButtonLink href="/shop" className="mt-6">
          Everything we stock
        </ButtonLink>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid items-start gap-10 lg:grid-cols-[1fr_22rem] lg:gap-12"
    >
      <div className="flex flex-col gap-10">
        {formError && (
          <div
            role="alert"
            className="rounded-card border border-red/30 bg-red-soft p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 size-5 shrink-0 text-red-deep"
                aria-hidden="true"
              />
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">
                  {formError}
                </p>
                {shortfalls.length > 0 && (
                  <>
                    <ul className="mt-2 flex flex-col gap-1 text-[0.8125rem] leading-relaxed text-ink">
                      {shortfalls.map((s) => {
                        const line = basket.lines.find(
                          (l) => l.variantId === s.variantId,
                        );
                        return (
                          <li key={s.variantId}>
                            {line?.productName ?? 'One of your items'}
                            {': '}
                            {s.available === 0
                              ? 'sold out while you were checking out.'
                              : `only ${s.available} left, you asked for ${s.requested}.`}
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
                            shortfalls.map((s) => [s.variantId, s.available]),
                          ),
                        )
                      }
                    >
                      Adjust my basket
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Your details ---------------- */}
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-[1.125rem] font-bold text-ink">
            Your details
          </h2>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-grey-strong">
            We ask for a mobile number because the courier needs one, and for an
            email because that is where your reference and updates go. Nothing
            else.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField
              name="customerName"
              label="Full name"
              required
              autoComplete="name"
              error={errorFor('customerName')}
              className="sm:col-span-2"
            />
            <TextField
              name="customerEmail"
              label="Email"
              type="email"
              inputMode="email"
              required
              autoComplete="email"
              description="Your reference and order updates go here."
              error={errorFor('customerEmail')}
            />
            <TextField
              name="customerMobile"
              label="Mobile number"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              placeholder="082 123 4567"
              error={errorFor('customerMobile')}
            />
          </div>
        </section>

        {/* ---------------- Delivery or collection ---------------- */}
        <section aria-labelledby="fulfilment-heading">
          <h2
            id="fulfilment-heading"
            className="text-[1.125rem] font-bold text-ink"
          >
            Getting it to you
          </h2>

          <fieldset className="mt-5">
            <legend className="sr-only">How would you like it?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                name="fulfilment"
                value="delivery"
                checked={fulfilment === 'delivery'}
                onSelect={() => {
                  setFulfilment('delivery');
                  track({ name: 'fulfilment_selected', method: 'delivery' });
                }}
                icon={Truck}
                title={FULFILMENT_LABELS.delivery}
                detail={`${store.deliveryDays.min} to ${store.deliveryDays.max} working days. Free over ${formatPrice(store.freeDeliveryThresholdCents)}, otherwise ${formatPrice(store.standardDeliveryCents)}.`}
              />
              <ChoiceCard
                name="fulfilment"
                value="collect"
                checked={fulfilment === 'collect'}
                onSelect={() => {
                  setFulfilment('collect');
                  track({ name: 'fulfilment_selected', method: 'collect' });
                }}
                icon={StoreIcon}
                title={FULFILMENT_LABELS.collect}
                detail={`${store.address.line1}, ${store.address.suburb}. Free, and usually ready the same day.`}
              />
            </div>
          </fieldset>

          {fulfilment === 'delivery' && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <TextField
                name="addressLine1"
                label="Street address"
                required
                autoComplete="address-line1"
                error={errorFor('addressLine1')}
                className="sm:col-span-2"
              />
              <TextField
                name="addressLine2"
                label="Complex, unit or building"
                autoComplete="address-line2"
                error={errorFor('addressLine2')}
                className="sm:col-span-2"
              />
              <TextField
                name="suburb"
                label="Suburb"
                required
                autoComplete="address-level2"
                error={errorFor('suburb')}
              />
              <TextField
                name="city"
                label="City or town"
                required
                autoComplete="address-level2"
                error={errorFor('city')}
              />
              <ProvinceField error={errorFor('province')} />
              <TextField
                name="postalCode"
                label="Postal code"
                required
                inputMode="tel"
                maxLength={4}
                autoComplete="postal-code"
                error={errorFor('postalCode')}
              />
            </div>
          )}
        </section>

        {/* ---------------- Payment ---------------- */}
        <section aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="text-[1.125rem] font-bold text-ink">
            Paying
          </h2>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-grey-strong">
            No card details are entered on this site.
          </p>

          <fieldset className="mt-5">
            <legend className="sr-only">How would you like to pay?</legend>
            <div className="grid gap-3">
              {paymentMethods.map((method) => (
                <ChoiceCard
                  key={method}
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onSelect={() => {
                    setPaymentMethod(method);
                    track({ name: 'payment_method_selected', method });
                  }}
                  icon={method === 'eft' ? Banknote : CreditCard}
                  title={PAYMENT_METHOD_LABELS[method]}
                  detail={
                    method === 'eft'
                      ? 'We send banking details with your reference. Your order is held while the transfer clears.'
                      : method === 'card_on_collection'
                        ? 'Pay at the counter when you pick it up. Card or cash, whichever suits.'
                        : 'You are taken to the payment page to complete the card payment.'
                  }
                />
              ))}
            </div>
          </fieldset>
        </section>

        {/* ---------------- Trade in and notes ---------------- */}
        <section aria-labelledby="extras-heading">
          <h2 id="extras-heading" className="text-[1.125rem] font-bold text-ink">
            Anything else
          </h2>

          <div className="mt-5 flex flex-col gap-4">
            <TextField
              name="tradeInReference"
              label="Trade in reference"
              value={tradeInReference}
              onChange={(event) => setTradeInReference(event.target.value)}
              description="If you have a trade in quote from us, enter its reference and we will set it against this order."
              error={errorFor('tradeInReference')}
            />
            <TextAreaField
              name="notes"
              label="Anything we should know"
              rows={3}
              placeholder="Gate code, best delivery time, a question about the device."
              error={errorFor('notes')}
            />
          </div>
        </section>

        {/* ---------------- Consent ---------------- */}
        <section aria-labelledby="consent-heading" className="flex flex-col gap-4">
          <h2 id="consent-heading" className="sr-only">
            Terms and consent
          </h2>
          <CheckboxField
            name="acceptedTerms"
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            error={errorFor('acceptedTerms')}
            label={
              <>
                I have read the{' '}
                <Link
                  href="/legal/terms"
                  className="font-semibold underline decoration-red decoration-2 underline-offset-2 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  terms of sale
                </Link>{' '}
                and the{' '}
                <Link
                  href="/legal/privacy"
                  className="font-semibold underline decoration-red decoration-2 underline-offset-2 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  privacy notice
                </Link>
                , including the {store.returnWindowDays} day return window.
              </>
            }
          />
          <CheckboxField
            name="marketingOptIn"
            checked={marketingOptIn}
            onChange={setMarketingOptIn}
            label="Email me when stock I might want comes in. Not more than twice a month."
          />
          <p className="text-[0.75rem] leading-relaxed text-grey">
            Your details are used to fulfil this order and to support it
            afterwards. We do not sell them. You can ask us to delete them once
            the warranty period ends.
          </p>
        </section>
      </div>

      {/* ---------------- Summary ---------------- */}
      <aside
        aria-labelledby="checkout-summary-heading"
        className="rounded-card border border-line bg-paper p-5 lg:sticky lg:top-24"
      >
        <h2
          id="checkout-summary-heading"
          className="text-[1rem] font-bold text-ink"
        >
          What you are buying
        </h2>

        <ul className="mt-4 flex flex-col gap-3 border-b border-line pb-4">
          {basket.lines.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[0.8125rem] font-medium text-ink">
                  {line.productName}
                </p>
                <p className="text-[0.75rem] text-grey-strong">
                  {line.variantLabel}
                  {line.quantity > 1 ? `, ${line.quantity}` : ''}
                </p>
              </div>
              <p className="shrink-0 text-[0.8125rem] font-semibold tabular-nums text-ink">
                {formatPrice(line.priceCents * line.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex flex-col gap-2.5 text-[0.875rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-grey-strong">Subtotal</dt>
            <dd className="font-semibold tabular-nums text-ink">
              {formatPrice(subtotalCents)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-grey-strong">
              {fulfilment === 'collect' ? 'Collection' : 'Delivery'}
            </dt>
            <dd
              className={cn(
                'font-semibold tabular-nums',
                shippingCents === 0 ? 'text-leaf' : 'text-ink',
              )}
            >
              {shippingCents === 0 ? 'Free' : formatPrice(shippingCents)}
            </dd>
          </div>
          <div className="mt-2 flex justify-between gap-4 border-t border-line pt-3.5">
            <dt className="text-[1rem] font-bold text-ink">Total</dt>
            <dd className="text-[1.125rem] font-bold tabular-nums text-ink">
              {formatPrice(subtotalCents + shippingCents)}
            </dd>
          </div>
        </dl>

        <p className="mt-2 text-[0.75rem] text-grey">
          Includes VAT. A trade in, if you entered one, is applied once we
          verify it and will show on your confirmation.
        </p>

        <Button
          type="submit"
          variant="critical"
          size="lg"
          block
          className="mt-5"
          loading={submitting}
          loadingLabel="Placing your order"
        >
          Place order
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>

        <p className="mt-3 text-center text-[0.75rem] leading-relaxed text-grey">
          Placing the order holds the stock for you. Payment comes next.
        </p>
      </aside>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

/**
 * A radio dressed as a card.
 *
 * The input is a real radio, visually hidden but present, so arrow-key
 * behaviour inside the fieldset and the announced role come from the browser
 * rather than from code here.
 */
function ChoiceCard({
  name,
  value,
  checked,
  onSelect,
  icon: Icon,
  title,
  detail,
}: {
  readonly name: string;
  readonly value: string;
  readonly checked: boolean;
  readonly onSelect: () => void;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly title: string;
  readonly detail: string;
}) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-start gap-3 rounded-card border p-4',
        'transition-[border-color,background-color,box-shadow] duration-[--duration-feedback] ease-out',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-red',
        checked
          ? 'border-ink bg-white shadow-[0_1px_2px_rgb(13_17_23/0.06)]'
          : 'border-line bg-white hover:border-line-strong',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <Icon
        className={cn(
          'mt-0.5 size-5 shrink-0',
          checked ? 'text-red' : 'text-grey',
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-semibold text-ink">
          {title}
        </span>
        <span className="mt-0.5 block text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
          {detail}
        </span>
      </span>
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-ink bg-ink' : 'border-line-strong',
        )}
        aria-hidden="true"
      >
        {checked && <Check className="size-3 text-white" />}
      </span>
    </label>
  );
}

function ProvinceField({ error }: { readonly error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="province"
        className="text-[0.8125rem] font-medium text-ink"
      >
        Province
        <span className="ml-1 text-grey-strong" aria-hidden="true">
          (required)
        </span>
      </label>
      {/* A native select for a nine-item list of known values. There is nothing
          here a custom listbox would do better. */}
      <select
        id="province"
        name="province"
        required
        defaultValue=""
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-12 w-full rounded-panel border bg-white px-3 text-[0.9375rem] text-ink',
          'transition-[border-color] duration-[--duration-feedback]',
          'focus:border-ink focus:outline-none',
          error ? 'border-[--color-critical]' : 'border-line-strong',
        )}
      >
        <option value="" disabled>
          Choose a province
        </option>
        {PROVINCES.map((province) => (
          <option key={province} value={province}>
            {province}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs font-medium text-[--color-critical]">{error}</p>
      )}
    </div>
  );
}

/**
 * The confirmation, rendered in place.
 *
 * Everything the customer needs is on this screen: the reference, the total and
 * the payment instruction. Nothing important is only in an email, because
 * emails get filtered and this is the moment somebody has their order in front
 * of them.
 */
function OrderPlaced({
  order,
  fulfilment,
}: {
  readonly order: PlacedOrder;
  readonly fulfilment: FulfilmentMethod;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-card border border-line bg-white p-6 sm:p-8">
        <span className="flex size-11 items-center justify-center rounded-full bg-leaf-soft">
          <Check className="size-5 text-leaf" aria-hidden="true" />
        </span>

        <h2 className="text-display mt-5 text-[1.75rem] text-ink">
          That is your order placed
        </h2>
        <p className="mt-3 text-pretty text-[1rem] leading-relaxed text-grey-strong">
          The stock is now held for you. Keep the reference below; it is how we
          find your order and how you track it.
        </p>

        <div className="mt-6 rounded-card bg-canvas p-5">
          <p className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
            Your reference
          </p>
          <p className="text-spec mt-1 text-[1.5rem] font-medium text-ink">
            {order.reference}
          </p>
        </div>

        <dl className="mt-6 flex flex-col gap-2.5 text-[0.9375rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-grey-strong">Subtotal</dt>
            <dd className="tabular-nums text-ink">
              {formatPrice(order.subtotalCents)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-grey-strong">
              {fulfilment === 'collect' ? 'Collection' : 'Delivery'}
            </dt>
            <dd className="tabular-nums text-ink">
              {order.shippingCents === 0
                ? 'Free'
                : formatPrice(order.shippingCents)}
            </dd>
          </div>
          {order.tradeInCents > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-grey-strong">Trade in</dt>
              <dd className="tabular-nums text-leaf">
                {`Less ${formatPrice(order.tradeInCents)}`}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-line pt-3">
            <dt className="font-bold text-ink">Total to pay</dt>
            <dd className="text-[1.125rem] font-bold tabular-nums text-ink">
              {formatPrice(order.totalCents)}
            </dd>
          </div>
        </dl>

        {order.payment && (
          <div className="mt-6 rounded-card border border-line bg-paper p-5">
            <h3 className="text-[0.9375rem] font-bold text-ink">
              Paying for it
            </h3>
            <p className="mt-2 text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
              {order.payment.instruction}
            </p>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/order">Track this order</ButtonLink>
          <ButtonLink href="/shop" variant="secondary">
            Keep shopping
          </ButtonLink>
        </div>

        <p className="mt-5 text-[0.8125rem] leading-relaxed text-grey">
          Questions about it? Phone us on{' '}
          <a
            href={`tel:${store.telephone.e164}`}
            className="font-semibold text-ink hover:text-red"
          >
            {store.telephone.display}
          </a>{' '}
          with that reference to hand.
        </p>
      </div>
    </div>
  );
}
