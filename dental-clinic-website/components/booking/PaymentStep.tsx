'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CreditCard,
  Info,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/currency';
import { track } from '@/lib/analytics';
import type { DepositType, ServiceSummaryDto, SlotDto } from '@/types';

/**
 * Step five: confirm, and settle any deposit.
 *
 * A darker blue glass panel marks this out as the point of commitment,
 * separating it visually from the rest of the journey.
 *
 * There is no card form anywhere in this component, and there is none
 * anywhere in the application. Either the configured provider hosts its own
 * checkout and the patient is redirected to it, or the deposit is settled at
 * the practice. The practice therefore never handles card data and stays out
 * of PCI scope. `canTakePaymentOnline` is false until a gateway is configured,
 * and the whole flow completes regardless.
 */

export interface PaymentSummary {
  readonly service: ServiceSummaryDto;
  readonly slot: SlotDto;
  readonly dateLabel: string;
}

export function PaymentStep({
  summary,
  canTakePaymentOnline,
  submitting,
  error,
  onConfirm,
}: {
  readonly summary: PaymentSummary;
  readonly canTakePaymentOnline: boolean;
  readonly submitting: boolean;
  readonly error: string | null;
  readonly onConfirm: (payNow: boolean) => void;
}) {
  const { service, slot, dateLabel } = summary;
  const depositType = service.depositType as DepositType;
  const deposit = service.depositAmountCents ?? 0;
  const total = service.priceFromCents;
  const remaining = total !== null ? Math.max(total - deposit, 0) : null;

  // Only meaningful when a gateway exists. With settlement at the practice
  // there is one path, so no choice is presented.
  const [payNow, setPayNow] = useState(
    canTakePaymentOnline && depositType !== 'none',
  );

  const rows: { label: string; value: string }[] = [
    { label: 'Appointment', value: service.name },
    { label: 'Dentist', value: slot.dentistName },
    { label: 'Date', value: dateLabel },
    { label: 'Time', value: `${slot.startLabel} to ${slot.endLabel}` },
    {
      label: 'Appointment fee',
      value: total !== null ? `From ${formatPrice(total)}` : 'Quoted after assessment',
    },
  ];

  if (depositType !== 'none') {
    rows.push({ label: 'Deposit', value: formatPrice(deposit) });
    if (remaining !== null) {
      rows.push({
        label: 'Balance at the practice',
        value: `From ${formatPrice(remaining)}`,
      });
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-10">
      {/* ---------------- Summary panel ---------------- */}
      <div className="rounded-card glass-blue p-5 sm:p-6">
        <h2 className="text-[1.0625rem] font-semibold text-white">
          Confirm your appointment
        </h2>
        <p className="mt-1 text-[0.8125rem] text-white/60">
          Nothing is booked until you confirm below.
        </p>

        <dl className="mt-6 flex flex-col gap-px overflow-hidden rounded-panel">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 bg-white/[0.06] px-4 py-3"
            >
              <dt className="text-[0.8125rem] text-white/55">{row.label}</dt>
              <dd className="text-right text-[0.9375rem] font-medium tabular-nums text-white">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {total !== null && (
          <p className="mt-4 text-xs leading-relaxed text-white/50">
            The appointment fee is a starting figure. Anything beyond the
            appointment itself is quoted in writing before it goes ahead.
          </p>
        )}

        <p className="mt-5 flex items-start gap-2 border-t border-white/10 pt-5 text-xs leading-relaxed text-white/55">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-soft" aria-hidden="true" />
          <span>
            We never ask for card details on this site and we do not store
            them. Card payments happen either on the provider&rsquo;s own
            secure page or in person at reception.
          </span>
        </p>
      </div>

      {/* ---------------- Action panel ---------------- */}
      <div>
        {depositType === 'none' ? (
          <div className="rounded-card border border-line bg-canvas p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-panel bg-white text-[--color-positive]">
                <CalendarClock className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">
                  No deposit needed
                </p>
                <p className="mt-1 text-sm leading-relaxed text-grey-strong">
                  Settle the fee at reception on the day. If you cannot make it,
                  please give us a day&rsquo;s notice so the time can go to
                  someone else.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-card border border-line bg-white p-5">
            <p className="text-[0.9375rem] font-semibold text-ink">
              {depositType === 'required'
                ? `A ${formatPrice(deposit)} deposit holds this appointment`
                : `Deposit of ${formatPrice(deposit)}, if you would like to pay now`}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-grey-strong">
              {depositType === 'required'
                ? 'This appointment type holds back time that is in short supply, so a deposit secures it. It comes off the cost of your treatment.'
                : 'Entirely optional. It comes off the cost of your treatment either way.'}
            </p>

            {canTakePaymentOnline ? (
              <fieldset className="mt-5">
                <legend className="sr-only">How would you like to pay?</legend>
                <div className="flex flex-col gap-2">
                  <PayOption
                    checked={payNow}
                    onSelect={() => {
                      setPayNow(true);
                      track({ name: 'deposit_selected', choice: 'pay_now' });
                    }}
                    icon={<CreditCard className="size-4" aria-hidden="true" />}
                    title={`Pay ${formatPrice(deposit)} now`}
                    detail="You will be taken to a secure payment page."
                  />
                  {depositType === 'optional' && (
                    <PayOption
                      checked={!payNow}
                      onSelect={() => {
                        setPayNow(false);
                        track({
                          name: 'deposit_selected',
                          choice: 'pay_at_appointment',
                        });
                      }}
                      icon={<Building2 className="size-4" aria-hidden="true" />}
                      title="Pay at the appointment"
                      detail="Settle everything at reception on the day."
                    />
                  )}
                </div>
              </fieldset>
            ) : (
              /* No gateway configured. One clear path, stated plainly. */
              <div className="mt-5 flex items-start gap-2.5 rounded-panel bg-canvas p-4">
                <Building2
                  className="mt-0.5 size-4 shrink-0 text-blue"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[0.8125rem] font-medium text-ink">
                    Pay the deposit at the practice
                  </p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-grey-strong">
                    Your appointment is held as soon as you confirm. Pay by card
                    at reception, or by electronic transfer using your booking
                    reference, and we will mark it received.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Emergency bookings get guidance here rather than a product offer. */}
        {service.isEmergency && (
          <div className="mt-4 flex items-start gap-2.5 rounded-card border border-[--color-caution] bg-[--color-caution-soft] p-4">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-[--color-caution]"
              aria-hidden="true"
            />
            <p className="text-[0.8125rem] leading-relaxed text-[--color-caution]">
              If your symptoms worsen before your appointment, phone the
              practice. For difficulty breathing or swallowing, uncontrolled
              bleeding, or swelling closing your eye or throat, go to a hospital
              emergency department.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-card border border-[--color-critical] bg-[--color-critical-soft] p-4"
          >
            <Info
              className="mt-0.5 size-4 shrink-0 text-[--color-critical]"
              aria-hidden="true"
            />
            <p className="text-[0.8125rem] leading-relaxed text-[--color-critical]">
              {error}
            </p>
          </div>
        )}

        <Button
          size="lg"
          block
          className="mt-5"
          loading={submitting}
          loadingLabel="Confirming"
          onClick={() => onConfirm(payNow)}
        >
          {depositType === 'required' && canTakePaymentOnline && payNow
            ? `Pay ${formatPrice(deposit)} and confirm`
            : 'Confirm appointment'}
        </Button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-grey-strong">
          <Lock className="size-3" aria-hidden="true" />
          You can cancel or move this online afterwards.
        </p>
      </div>
    </div>
  );
}

function PayOption({
  checked,
  onSelect,
  icon,
  title,
  detail,
}: {
  readonly checked: boolean;
  readonly onSelect: () => void;
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly detail: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-panel border p-3.5',
        'transition-[border-color,background-color] duration-[--duration-feedback] ease-out',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue',
        checked
          ? 'border-blue bg-blue-tint'
          : 'border-line-strong bg-white hover:border-blue/40',
      )}
    >
      <input
        type="radio"
        name="depositChoice"
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 size-4 shrink-0 accent-blue"
      />
      <span className="flex items-center gap-2 text-blue-deep">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-medium text-ink">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-grey-strong">{detail}</span>
      </span>
    </label>
  );
}
