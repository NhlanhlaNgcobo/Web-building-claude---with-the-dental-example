'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBasket,
  Store,
  Trash2,
} from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Primitives';
import { CheckboxField, TextAreaField, TextField } from '@/components/ui/TextField';
import { useBasket } from '@/hooks/useBasket';
import { clinic } from '@/data/clinic';
import { formatPrice } from '@/lib/currency';
import { BLUR_PLACEHOLDER } from '@/data/images';

/**
 * Basket and collection details.
 *
 * Nothing is charged here. Orders are reserved for collection and paid at
 * reception, which is why there is no payment step and no card field: the
 * practice does not need a gateway to put a tube of toothpaste aside for
 * somebody.
 */

interface OrderResult {
  readonly reference: string;
  readonly totalCents: number;
  readonly fulfilment: string;
  readonly attachedToAppointment: boolean;
}

export function BasketPanel() {
  const { lines, itemCount, subtotalCents, hydrated, setQuantity, remove, clear } =
    useBasket();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [atAppointment, setAtAppointment] = useState(false);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<OrderResult | null>(null);

  /* ---------------- Placed ---------------- */

  if (placed) {
    return (
      <div className="rounded-card glass-light p-6 sm:p-8">
        <span className="flex size-10 items-center justify-center rounded-full bg-[--color-positive-soft] text-[--color-positive]">
          <CheckCircle2 className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-[1.25rem] font-semibold text-ink">
          Reserved for collection
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-grey-strong">
          Your order reference is{' '}
          <span className="font-semibold tabular-nums text-ink">
            {placed.reference}
          </span>
          . Total {formatPrice(placed.totalCents)}, payable when you collect.
        </p>
        <p className="mt-3 rounded-panel bg-canvas p-4 text-[0.8125rem] leading-relaxed text-grey-strong">
          {placed.attachedToAppointment
            ? 'We will have this ready at your appointment.'
            : `Collect from reception during opening hours. Phone ${clinic.telephone.display} if you would like us to put it aside for a particular day.`}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/shop" variant="secondary">
            Back to the shop
          </ButtonLink>
          <ButtonLink href="/book" variant="ghost">
            Book an appointment
          </ButtonLink>
        </div>
      </div>
    );
  }

  /* ---------------- Loading and empty ---------------- */

  if (!hydrated) {
    return (
      <div
        className="h-64 animate-pulse rounded-card bg-canvas-deep"
        role="status"
        aria-busy="true"
        aria-label="Loading your basket"
      />
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBasket className="size-5" aria-hidden="true" />}
        title="Your basket is empty"
        description="Have a look at what we stock. Most of it lasts months, so it is worth picking up alongside an appointment."
        action={<ButtonLink href="/shop">Browse the shop</ButtonLink>}
      />
    );
  }

  /* ---------------- Submit ---------------- */

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (name.trim().length === 0) next.name = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    const digits = mobile.replace(/[^\d+]/g, '');
    const e164 = digits.startsWith('+27')
      ? digits
      : digits.startsWith('0')
        ? `+27${digits.slice(1)}`
        : digits;
    if (!/^\+27[6-8]\d{8}$/.test(e164)) {
      next.mobile = 'Enter a valid South African mobile number';
    }
    if (atAppointment && reference.trim().length < 6) {
      next.reference = 'Enter your booking reference, or collect from reception instead';
    }
    if (!consent) {
      next.consent = 'Please consent to us storing your contact details';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
          contact: {
            name: name.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
          },
          fulfilment: atAppointment ? 'collect_at_appointment' : 'collect',
          appointmentReference: atAppointment ? reference.trim() : undefined,
          notes: notes.trim() || undefined,
          popiaConsent: true,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: { message?: string } };
        setSubmitError(
          body.error?.message ?? 'We could not place that order. Please try again.',
        );
        return;
      }

      const result = (await response.json()) as OrderResult;
      clear();
      setPlaced(result);
    } catch {
      setSubmitError(
        'We could not reach the practice. Please check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-10">
      {/* ---------------- Lines ---------------- */}
      <div>
        <h2 className="text-[1.0625rem] font-semibold text-ink">
          Your basket
          <span className="ml-2 text-sm font-normal tabular-nums text-grey-strong">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </h2>

        <ul className="mt-5 flex flex-col gap-3">
          {lines.map((line) => (
            <li
              key={line.productId}
              className="flex gap-4 rounded-card border border-line bg-white p-4"
            >
              <Link
                href={`/shop/${line.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-panel bg-canvas-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
              >
                <Image
                  src={line.imageUrl}
                  alt=""
                  fill
                  sizes="80px"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/shop/${line.slug}`}
                  className="text-[0.9375rem] font-medium text-ink hover:text-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                >
                  {line.name}
                </Link>
                <p className="mt-0.5 text-[0.8125rem] tabular-nums text-grey-strong">
                  {formatPrice(line.priceCents)} each
                </p>

                <div className="mt-auto flex items-center justify-between gap-4 pt-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(line.productId, line.quantity - 1)
                      }
                      aria-label={`Reduce quantity of ${line.name}`}
                      className="flex size-8 items-center justify-center rounded-panel border border-line-strong text-charcoal transition-colors duration-[--duration-feedback] hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                    >
                      <Minus className="size-3.5" aria-hidden="true" />
                    </button>
                    <span
                      className="w-9 text-center text-sm font-medium tabular-nums text-ink"
                      aria-live="polite"
                      aria-label={`Quantity of ${line.name}`}
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(line.productId, line.quantity + 1)
                      }
                      aria-label={`Increase quantity of ${line.name}`}
                      className="flex size-8 items-center justify-center rounded-panel border border-line-strong text-charcoal transition-colors duration-[--duration-feedback] hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-[0.9375rem] font-semibold tabular-nums text-ink">
                      {formatPrice(line.priceCents * line.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      aria-label={`Remove ${line.name} from basket`}
                      className="flex size-8 items-center justify-center rounded-panel text-grey transition-colors duration-[--duration-feedback] hover:bg-[--color-critical-soft] hover:text-[--color-critical] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Clearing the whole basket is destructive enough to confirm. */}
        <AlertDialog.Root>
          <AlertDialog.Trigger className="mt-4 inline-flex items-center gap-1.5 rounded-panel text-[0.8125rem] font-medium text-grey-strong transition-colors duration-[--duration-feedback] hover:text-[--color-critical] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue">
            <Trash2 className="size-3.5" aria-hidden="true" />
            Empty basket
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className="fixed inset-0 z-overlay min-h-dvh bg-ink/40 transition-opacity duration-[--duration-feedback] data-starting-style:opacity-0 data-ending-style:opacity-0" />
            <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-modal w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-white p-6 shadow-[0_24px_64px_-16px_rgb(10_11_13/0.28)] transition-[opacity,transform] duration-[--duration-feedback] ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0">
              <AlertDialog.Title className="text-[1.0625rem] font-semibold text-ink">
                Empty your basket?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-grey-strong">
                This removes all {itemCount}{' '}
                {itemCount === 1 ? 'item' : 'items'}. You will need to add them
                again.
              </AlertDialog.Description>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <AlertDialog.Close className="inline-flex h-11 items-center justify-center rounded-panel border border-line-strong bg-white px-5 text-sm font-medium text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue">
                  Keep items
                </AlertDialog.Close>
                <AlertDialog.Close
                  onClick={clear}
                  className="inline-flex h-11 items-center justify-center rounded-panel bg-[--color-critical] px-5 text-sm font-medium text-white transition-[filter] duration-[--duration-feedback] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--color-critical]"
                >
                  Empty basket
                </AlertDialog.Close>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>

      {/* ---------------- Collection details ---------------- */}
      <form noValidate onSubmit={submit}>
        <div className="rounded-card glass-light p-5">
          <h2 className="text-[0.9375rem] font-semibold text-ink">Summary</h2>
          <dl className="mt-4 flex flex-col gap-2">
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-grey-strong">Subtotal</dt>
              <dd className="font-medium tabular-nums text-ink">
                {formatPrice(subtotalCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-grey-strong">Collection</dt>
              <dd className="font-medium text-ink">Free</dd>
            </div>
            <div className="mt-2 flex justify-between gap-4 border-t border-line pt-3">
              <dt className="text-[0.9375rem] font-semibold text-ink">Total</dt>
              <dd className="text-[1.125rem] font-semibold tabular-nums text-ink">
                {formatPrice(subtotalCents)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-grey-strong">
            Paid when you collect. Nothing is charged now.
          </p>
        </div>

        <div className="mt-5 rounded-card border border-line bg-white p-5">
          <h2 className="text-[0.9375rem] font-semibold text-ink">
            Collection details
          </h2>

          <div className="mt-4 flex flex-col gap-4">
            <TextField
              name="name"
              label="Name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <TextField
              name="email"
              label="Email address"
              type="email"
              inputMode="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <TextField
              name="mobile"
              label="Mobile number"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              placeholder="082 123 4567"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              error={errors.mobile}
            />
          </div>

          {/* Collect at an appointment */}
          <div className="mt-5 rounded-panel bg-canvas p-4">
            <CheckboxField
              name="atAppointment"
              checked={atAppointment}
              onChange={setAtAppointment}
              label={
                <span className="flex items-center gap-2">
                  <CalendarCheck
                    className="size-4 shrink-0 text-blue"
                    aria-hidden="true"
                  />
                  I have an appointment booked, collect it then
                </span>
              }
            />
            {atAppointment && (
              <div className="mt-4">
                <TextField
                  name="reference"
                  label="Booking reference"
                  required
                  placeholder="HDS-7K4Q2M"
                  description="We will match it to your appointment using this email address."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  error={errors.reference}
                />
              </div>
            )}
          </div>

          <div className="mt-5">
            <TextAreaField
              name="notes"
              label="Anything else"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-5">
            <CheckboxField
              name="consent"
              checked={consent}
              onChange={setConsent}
              error={errors.consent}
              label={
                <>
                  I agree that my contact details may be stored to manage this
                  order, as set out in the{' '}
                  <Link
                    href="/legal/privacy"
                    target="_blank"
                    className="font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
                  >
                    privacy notice
                  </Link>
                  .
                </>
              }
            />
          </div>

          {submitError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-card border border-[--color-critical] bg-[--color-critical-soft] p-4"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0 text-[--color-critical]"
                aria-hidden="true"
              />
              <p className="text-[0.8125rem] leading-relaxed text-[--color-critical]">
                {submitError}
              </p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            block
            className="mt-5"
            loading={submitting}
            loadingLabel="Reserving"
          >
            <Store className="size-4" aria-hidden="true" />
            Reserve for collection
          </Button>
        </div>
      </form>
    </div>
  );
}
