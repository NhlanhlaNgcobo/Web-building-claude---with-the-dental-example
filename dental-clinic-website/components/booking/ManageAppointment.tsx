'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import {
  AlertCircle,
  CalendarPlus,
  CalendarX2,
  Clock,
  MapPin,
  Phone,
  Search,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, ButtonAnchor } from '@/components/ui/Button';
import { StatusBadge } from './ConfirmationCard';
import { DateTimeStep } from './DateTimeStep';
import { TextField } from '@/components/ui/TextField';
import { addressLines, clinic } from '@/data/clinic';
import { formatPrice } from '@/lib/currency';
import type { BookingConfirmationDto } from '@/types';

/**
 * Manage an existing appointment.
 *
 * Verification is the booking reference plus one piece of contact detail the
 * patient already gave us. That is deliberately the weakest check that is
 * still meaningful: it keeps a legitimate patient from being locked out of
 * their own appointment, while making the reference useless on its own. The
 * server returns an identical "not found" for a bad reference and a bad
 * contact detail, so the endpoint cannot be used to enumerate bookings.
 *
 * Cancelling uses an AlertDialog rather than an inline button, because it
 * cannot be undone: a cancelled appointment releases its slot immediately and
 * somebody else may take it within seconds.
 */

type Verification = 'email' | 'mobile';

export function ManageAppointment({
  initialReference = '',
}: {
  readonly initialReference?: string;
}) {
  const router = useRouter();
  const [reference, setReference] = useState(initialReference);
  const [kind, setKind] = useState<Verification>('email');
  const [value, setValue] = useState('');
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [booking, setBooking] = useState<BookingConfirmationDto | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newTime, setNewTime] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [serviceSlug, setServiceSlug] = useState<string | null>(null);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setLooking(true);
    setLookupError(null);

    try {
      const response = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          verification: { kind, value },
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setLookupError(
          body.error?.message ??
            'No booking found with those details. Please check and try again.',
        );
        return;
      }

      const found = (await response.json()) as BookingConfirmationDto;
      setBooking(found);
      // The service slug drives the reschedule calendar. Derived from the
      // booking rather than asked for again.
      const slugResponse = await fetch(
        `/api/bookings/${found.reference}/service?token=${encodeURIComponent(found.manageToken)}`,
      ).catch(() => null);
      if (slugResponse?.ok) {
        const data = (await slugResponse.json()) as { slug: string };
        setServiceSlug(data.slug);
      }
    } catch {
      setLookupError(
        'We could not reach the practice diary. Please check your connection and try again.',
      );
    } finally {
      setLooking(false);
    }
  }

  async function doCancel() {
    if (!booking) return;
    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/bookings/${booking.reference}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: booking.manageToken }),
        },
      );
      if (!response.ok) {
        const body = (await response.json()) as { error?: { message?: string } };
        setActionError(
          body.error?.message ?? 'We could not cancel that appointment.',
        );
        return;
      }
      setCancelled(true);
    } catch {
      setActionError('We could not reach the practice diary. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  async function doReschedule() {
    if (!booking || newDate === null || newTime === null) return;
    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/bookings/${booking.reference}/reschedule`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: booking.manageToken,
            date: newDate,
            startMinutes: newTime,
          }),
        },
      );
      if (!response.ok) {
        const body = (await response.json()) as { error?: { message?: string } };
        setActionError(
          body.error?.message ??
            'That time is no longer available. Please choose another.',
        );
        return;
      }
      const updated = (await response.json()) as BookingConfirmationDto;
      setBooking(updated);
      setRescheduling(false);
      setNewDate(null);
      setNewTime(null);
    } catch {
      setActionError('We could not reach the practice diary. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  /* ---------------- Cancelled ---------------- */

  if (cancelled && booking) {
    return (
      <div className="rounded-card border border-line bg-white p-6 sm:p-8">
        <span className="flex size-10 items-center justify-center rounded-full bg-canvas-deep text-grey-strong">
          <CalendarX2 className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-[1.25rem] font-semibold text-ink">
          Appointment cancelled
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-grey-strong">
          Booking {booking.reference} has been cancelled and the time has been
          released. If you paid a deposit, reception will be in touch about
          refunding it.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => router.push('/book')}>
            Book a new appointment
          </Button>
          <ButtonAnchor
            href={`tel:${clinic.telephone.e164}`}
            variant="secondary"
          >
            <Phone className="size-4" aria-hidden="true" />
            {clinic.telephone.display}
          </ButtonAnchor>
        </div>
      </div>
    );
  }

  /* ---------------- Lookup form ---------------- */

  if (!booking) {
    return (
      <form
        noValidate
        onSubmit={lookup}
        className="rounded-card border border-line bg-white p-6 sm:p-8"
      >
        <h2 className="text-[1.0625rem] font-semibold text-ink">
          Find your appointment
        </h2>
        <p className="mt-1 text-sm text-grey-strong">
          Your reference is in your confirmation, and looks like HDS-7K4Q2M.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <TextField
            name="reference"
            label="Booking reference"
            required
            placeholder="HDS-7K4Q2M"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />

          <fieldset>
            <legend className="text-[0.8125rem] font-medium text-charcoal">
              Confirm it is you
            </legend>
            <div className="mt-2.5 flex gap-2">
              {(
                [
                  { id: 'email', label: 'Email address' },
                  { id: 'mobile', label: 'Mobile number' },
                ] as const
              ).map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'flex flex-1 cursor-pointer items-center gap-2.5 rounded-panel border px-3.5 py-2.5 text-sm',
                    'transition-[border-color,background-color] duration-[--duration-feedback] ease-out',
                    'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue',
                    kind === option.id
                      ? 'border-blue bg-blue-tint text-ink'
                      : 'border-line-strong bg-white text-charcoal hover:border-blue/40',
                  )}
                >
                  <input
                    type="radio"
                    name="verificationKind"
                    checked={kind === option.id}
                    onChange={() => {
                      setKind(option.id);
                      setValue('');
                    }}
                    className="size-4 shrink-0 accent-blue"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <TextField
            name="verificationValue"
            label={kind === 'email' ? 'Email address' : 'Mobile number'}
            type={kind === 'email' ? 'email' : 'tel'}
            inputMode={kind === 'email' ? 'email' : 'tel'}
            required
            autoComplete={kind === 'email' ? 'email' : 'tel'}
            placeholder={kind === 'email' ? 'you@example.co.za' : '082 123 4567'}
            description="Whichever you used when you booked."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        {lookupError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-card border border-[--color-critical] bg-[--color-critical-soft] p-4"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-[--color-critical]"
              aria-hidden="true"
            />
            <p className="text-[0.8125rem] leading-relaxed text-[--color-critical]">
              {lookupError}
            </p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="mt-6"
          loading={looking}
          loadingLabel="Searching"
        >
          <Search className="size-4" aria-hidden="true" />
          Find my appointment
        </Button>

        <p className="mt-5 border-t border-line pt-5 text-xs leading-relaxed text-grey-strong">
          Lost your reference? Phone reception on{' '}
          <a
            href={`tel:${clinic.telephone.e164}`}
            className="font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
          >
            {clinic.telephone.display}
          </a>{' '}
          and we will find you in the diary.
        </p>
      </form>
    );
  }

  /* ---------------- Found ---------------- */

  const terminal =
    booking.status === 'cancelled' ||
    booking.status === 'completed' ||
    booking.status === 'no_show';

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card glass-light p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-eyebrow">Booking {booking.reference}</p>
            <h2 className="mt-2 text-[1.375rem] font-semibold text-ink">
              {booking.serviceName}
            </h2>
            <p className="mt-1 text-sm text-grey-strong">
              with {booking.dentistName}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <dl className="mt-6 flex flex-col gap-px overflow-hidden rounded-card">
          {[
            { label: 'Patient', value: booking.patientFirstName },
            { label: 'Date', value: booking.dateLabel },
            {
              label: 'Time',
              value: `${booking.startLabel} to ${booking.endLabel}`,
            },
            { label: 'Duration', value: `${booking.durationMinutes} minutes` },
          ].map((row) => (
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

        {booking.depositType !== 'none' && (
          <p className="mt-5 flex items-start gap-2.5 rounded-panel bg-canvas p-4 text-[0.8125rem] leading-relaxed text-grey-strong">
            <Wallet className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Deposit {formatPrice(booking.depositAmountCents ?? 0)}:{' '}
              {booking.depositStatus === 'paid'
                ? 'received'
                : booking.depositStatus === 'refunded'
                  ? 'refunded'
                  : 'outstanding'}
              .
            </span>
          </p>
        )}

        <p className="mt-5 flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-grey-strong">
          <MapPin className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden="true" />
          <span>{addressLines().join(', ')}</span>
        </p>

        {actionError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-card border border-[--color-critical] bg-[--color-critical-soft] p-4"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-[--color-critical]"
              aria-hidden="true"
            />
            <p className="text-[0.8125rem] leading-relaxed text-[--color-critical]">
              {actionError}
            </p>
          </div>
        )}

        {terminal ? (
          <div className="mt-7 border-t border-line pt-6">
            <p className="text-sm text-grey-strong">
              This appointment is {booking.status === 'no_show' ? 'closed' : booking.status}{' '}
              and can no longer be changed online.
            </p>
            <Button className="mt-4" onClick={() => router.push('/book')}>
              Book a new appointment
            </Button>
          </div>
        ) : (
          <div className="mt-7 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row">
            <ButtonAnchor
              href={`/api/bookings/${booking.reference}/calendar?token=${encodeURIComponent(booking.manageToken)}`}
              download={`${booking.reference}.ics`}
              variant="secondary"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              Add to calendar
            </ButtonAnchor>

            <Button
              variant="secondary"
              onClick={() => {
                setRescheduling((v) => !v);
                setActionError(null);
              }}
            >
              <Clock className="size-4" aria-hidden="true" />
              {rescheduling ? 'Keep current time' : 'Move appointment'}
            </Button>

            {/* Irreversible, so it goes through a confirmation dialog. */}
            <AlertDialog.Root>
              <AlertDialog.Trigger
                className={cn(
                  'inline-flex h-11 items-center justify-center gap-2 rounded-panel px-5',
                  'text-sm font-medium text-[--color-critical]',
                  'transition-colors duration-[--duration-feedback] ease-out',
                  'hover:bg-[--color-critical-soft]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--color-critical]',
                )}
              >
                <CalendarX2 className="size-4" aria-hidden="true" />
                Cancel appointment
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Backdrop
                  className={cn(
                    'fixed inset-0 z-overlay min-h-dvh bg-ink/40',
                    'transition-opacity duration-[--duration-feedback]',
                    'data-starting-style:opacity-0 data-ending-style:opacity-0',
                  )}
                />
                <AlertDialog.Popup
                  className={cn(
                    'fixed left-1/2 top-1/2 z-modal w-[min(28rem,calc(100vw-2rem))]',
                    '-translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-white p-6',
                    'shadow-[0_24px_64px_-16px_rgb(10_11_13/0.28)]',
                    'transition-[opacity,transform] duration-[--duration-feedback] ease-out',
                    'data-starting-style:scale-[0.98] data-starting-style:opacity-0',
                    'data-ending-style:scale-[0.98] data-ending-style:opacity-0',
                  )}
                >
                  <AlertDialog.Title className="text-[1.0625rem] font-semibold text-ink">
                    Cancel this appointment?
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-grey-strong">
                    Your {booking.startLabel} appointment on {booking.dateLabel}{' '}
                    will be released immediately, and somebody else may take it.
                    This cannot be undone, though you can always book again.
                  </AlertDialog.Description>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <AlertDialog.Close
                      className="inline-flex h-11 items-center justify-center rounded-panel border border-line-strong bg-white px-5 text-sm font-medium text-ink transition-colors duration-[--duration-feedback] hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                    >
                      Keep appointment
                    </AlertDialog.Close>
                    <AlertDialog.Close
                      onClick={() => void doCancel()}
                      className="inline-flex h-11 items-center justify-center rounded-panel bg-[--color-critical] px-5 text-sm font-medium text-white transition-[filter] duration-[--duration-feedback] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--color-critical]"
                    >
                      Yes, cancel it
                    </AlertDialog.Close>
                  </div>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        )}
      </div>

      {rescheduling && serviceSlug && (
        <div className="rounded-card border border-line bg-white p-6 sm:p-8">
          <h2 className="text-[1.0625rem] font-semibold text-ink">
            Choose a new time
          </h2>
          <p className="mt-1 text-sm text-grey-strong">
            Your current appointment stays booked until you confirm the move.
          </p>

          <div className="mt-6">
            <DateTimeStep
              serviceSlug={serviceSlug}
              dentistId="any"
              date={newDate}
              time={newTime}
              onSelectDate={(d) => {
                setNewDate(d);
                setNewTime(null);
              }}
              onSelectTime={setNewTime}
              onContinue={() => void doReschedule()}
            />
          </div>

          {newDate !== null && newTime !== null && (
            <Button
              size="lg"
              className="mt-6"
              loading={working}
              loadingLabel="Moving"
              onClick={() => void doReschedule()}
            >
              Confirm new time
            </Button>
          )}
        </div>
      )}

      {rescheduling && !serviceSlug && (
        <div className="rounded-card border border-line bg-canvas p-5">
          <p className="text-sm text-grey-strong">
            To move this appointment, please phone reception on{' '}
            <a
              href={`tel:${clinic.telephone.e164}`}
              className="font-medium text-blue underline decoration-blue/30 underline-offset-2"
            >
              {clinic.telephone.display}
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
