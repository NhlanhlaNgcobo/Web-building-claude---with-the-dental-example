'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  MapPin,
  Settings2,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Primitives';
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { addressLines, clinic } from '@/data/clinic';
import { formatPrice } from '@/lib/currency';
import type { BookingConfirmationDto } from '@/types';

/**
 * Booking confirmation.
 *
 * The one job here is that the patient leaves knowing their reference, when to
 * turn up and what they owe. Everything else is secondary to that, which is
 * why the reference is the largest element on the card and is one tap to copy.
 */
export function ConfirmationCard({
  booking,
  preparationNotes,
}: {
  readonly booking: BookingConfirmationDto;
  readonly preparationNotes: readonly string[];
}) {
  const [copied, setCopied] = useState(false);

  const depositOutstanding =
    booking.depositType !== 'none' && booking.depositStatus === 'unpaid';

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(booking.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused. The reference is visible on screen,
      // so there is nothing to recover from.
    }
  }

  const details = [
    { label: 'Patient', value: booking.patientFirstName },
    { label: 'Treatment', value: booking.serviceName },
    { label: 'Dentist', value: booking.dentistName },
    { label: 'Date', value: booking.dateLabel },
    {
      label: 'Time',
      value: `${booking.startLabel} to ${booking.endLabel}`,
    },
    { label: 'Duration', value: `${booking.durationMinutes} minutes` },
  ];

  return (
    <div className="rounded-card glass-light p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[--color-positive-soft] text-[--color-positive]">
          <CheckCircle2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-[1.375rem] font-semibold text-ink sm:text-[1.625rem]">
            {booking.status === 'pending'
              ? 'Appointment held'
              : 'Booking confirmed'}
          </h1>
          <p className="mt-1 text-sm text-grey-strong">
            {booking.status === 'pending'
              ? 'Your time is held. It is confirmed once the deposit reaches us.'
              : 'We have you in the diary. A reminder is not automatic, so do add this to your calendar.'}
          </p>
        </div>
      </div>

      {/* Reference, given the prominence it needs. */}
      <div className="mt-7 rounded-card border border-line bg-canvas p-5">
        <p className="text-eyebrow">Your booking reference</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-[1.75rem] font-semibold tabular-nums text-ink">
            {booking.reference}
          </p>
          <button
            type="button"
            onClick={() => void copyReference()}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-panel border px-3 text-[0.8125rem] font-medium',
              'transition-[border-color,background-color,color] duration-[--duration-feedback] ease-out',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
              copied
                ? 'border-[--color-positive] bg-[--color-positive-soft] text-[--color-positive]'
                : 'border-line-strong bg-white text-charcoal hover:border-ink',
            )}
          >
            {copied ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-xs text-grey-strong">
          Keep this. You need it to view, move or cancel your appointment.
        </p>
        <span aria-live="polite" className="sr-only">
          {copied ? 'Booking reference copied' : ''}
        </span>
      </div>

      {/* Details */}
      <dl className="mt-6 flex flex-col gap-px overflow-hidden rounded-card">
        {details.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 bg-canvas px-4 py-3"
          >
            <dt className="text-[0.8125rem] text-grey-strong">{row.label}</dt>
            <dd className="text-right text-[0.9375rem] font-medium text-ink">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Payment status */}
      <div
        className={cn(
          'mt-6 flex items-start gap-3 rounded-card border p-4',
          depositOutstanding
            ? 'border-[--color-caution] bg-[--color-caution-soft]'
            : 'border-line bg-canvas',
        )}
      >
        <Wallet
          className={cn(
            'mt-0.5 size-4 shrink-0',
            depositOutstanding ? 'text-[--color-caution]' : 'text-grey-strong',
          )}
          aria-hidden="true"
        />
        <div>
          <p
            className={cn(
              'text-[0.8125rem] font-semibold',
              depositOutstanding ? 'text-[--color-caution]' : 'text-ink',
            )}
          >
            {booking.depositType === 'none'
              ? 'No deposit required'
              : booking.depositStatus === 'paid'
                ? 'Deposit received'
                : `Deposit of ${formatPrice(booking.depositAmountCents ?? 0)} outstanding`}
          </p>
          <p
            className={cn(
              'mt-1 text-[0.8125rem] leading-relaxed',
              depositOutstanding ? 'text-[--color-caution]' : 'text-grey-strong',
            )}
          >
            {booking.depositType === 'none'
              ? 'Settle the appointment fee at reception on the day.'
              : booking.depositStatus === 'paid'
                ? 'It comes off the cost of your treatment.'
                : `Pay by card at reception, or by transfer quoting ${booking.reference}. Phone us on ${clinic.telephone.display} if you would rather arrange it now.`}
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="mt-6 flex items-start gap-3 rounded-card border border-line bg-white p-4">
        <MapPin className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden="true" />
        <div>
          <p className="text-[0.8125rem] font-semibold text-ink">
            {clinic.name}
          </p>
          <address className="mt-1 text-[0.8125rem] not-italic leading-relaxed text-grey-strong">
            {addressLines().join(', ')}
          </address>
          <p className="mt-1.5 text-xs text-grey-strong">
            {clinic.parking.summary}
          </p>
        </div>
      </div>

      {/* Preparation */}
      {preparationNotes.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink">
            <ClipboardCheck className="size-4 text-blue" aria-hidden="true" />
            Before you come in
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {preparationNotes.map((note) => (
              <li
                key={note}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-grey-strong"
              >
                <Check
                  className="mt-1 size-3.5 shrink-0 text-blue"
                  aria-hidden="true"
                />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Emergency guidance instead of anything commercial. */}
      {booking.isEmergency && (
        <div className="mt-6 flex items-start gap-2.5 rounded-card border border-[--color-caution] bg-[--color-caution-soft] p-4">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-[--color-caution]"
            aria-hidden="true"
          />
          <p className="text-[0.8125rem] leading-relaxed text-[--color-caution]">
            If your symptoms worsen before your appointment, phone us on{' '}
            {clinic.telephone.display}. {clinic.emergency.hospitalGuidance}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonAnchor
          href={`/api/bookings/${booking.reference}/calendar?token=${encodeURIComponent(booking.manageToken)}`}
          download={`${booking.reference}.ics`}
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          Add to Calendar
        </ButtonAnchor>
        <ButtonLink
          href={`/appointment?reference=${booking.reference}`}
          variant="secondary"
        >
          <Settings2 className="size-4" aria-hidden="true" />
          Manage Appointment
        </ButtonLink>
        <ButtonLink href="/book" variant="ghost">
          Book Another Appointment
        </ButtonLink>
      </div>

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-grey-strong">
        <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          You can move or cancel this online up to{' '}
          {clinic.cancellationNoticeHours} hours beforehand. After that, please{' '}
          <a
            href={`tel:${clinic.telephone.e164}`}
            className="font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
          >
            phone the practice
          </a>
          .
        </span>
      </p>
    </div>
  );
}

/** Status pill used beside the heading on the manage screen. */
export function StatusBadge({ status }: { readonly status: string }) {
  const tone =
    status === 'confirmed' || status === 'completed'
      ? 'positive'
      : status === 'cancelled' || status === 'no_show'
        ? 'critical'
        : 'caution';
  const label =
    status === 'pending'
      ? 'Awaiting deposit'
      : status === 'no_show'
        ? 'Did not attend'
        : status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge tone={tone}>{label}</Badge>;
}
